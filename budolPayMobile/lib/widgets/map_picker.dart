import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class MapPicker extends StatefulWidget {
  final LatLng? initialLocation;
  final Map<String, dynamic>? settings;

  const MapPicker({super.key, this.initialLocation, this.settings});

  @override
  State<MapPicker> createState() => _MapPickerState();
}

class _MapPickerState extends State<MapPicker> {
  late LatLng _selectedLocation;
  final MapController _mapController = MapController();
  final TextEditingController _searchController = TextEditingController();
  bool _isLoading = false;

  String get _tileUrl {
    final provider = widget.settings?['mapProvider'] ?? 'OSM';
    switch (provider) {
      case 'GEOAPIFY':
        final apiKey = widget.settings?['geoapifyApiKey'] ?? '';
        return 'https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}.png?apiKey=$apiKey';
      case 'GOOGLE':
        // Note: Flutter Map doesn't natively support Google Maps tiles easily without extra plugins or specific URL formats
        // Defaulting back to OSM for now if Google is selected but not fully implemented for tiles
        return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      case 'RADAR':
        // Similar to Google, Radar usually needs its own plugin or specific tile URL
        return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      default:
        return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  }

  @override
  void initState() {
    super.initState();
    _selectedLocation = widget.initialLocation ?? const LatLng(14.5995, 120.9842); // Default to Manila
    _reverseGeocodeCoordinate(_selectedLocation);
  }

  Future<void> _reverseGeocodeCoordinate(LatLng latLng) async {
    try {
      try {
        List<Placemark> placemarks = await placemarkFromCoordinates(
          latLng.latitude, 
          latLng.longitude,
        );
        if (placemarks.isNotEmpty) {
          final p = placemarks.first;
          final address = [p.street, p.subLocality, p.locality, p.administrativeArea, p.country]
              .where((part) => part != null && part.isNotEmpty)
              .join(', ');
          if (address.isNotEmpty) {
            _searchController.text = address;
            return;
          }
        }
      } catch (_) {
        // Native geocoding failed, fallback to OSM Nominatim
      }

      // OSM Fallback
      final url = Uri.parse('https://nominatim.openstreetmap.org/reverse?lat=${latLng.latitude}&lon=${latLng.longitude}&format=json');
      final response = await http.get(url, headers: {'User-Agent': 'budolPayApp/1.0'});
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data != null && data['display_name'] != null) {
          _searchController.text = data['display_name'];
        }
      }
    } catch (e) {
      debugPrint('Reverse geocode error: $e');
    }
  }

  Future<void> _geocodeAddress(String query) async {
    if (query.isEmpty) return;
    setState(() => _isLoading = true);
    try {
      LatLng? resultLatLng;
      
      try {
        List<Location> locations = await locationFromAddress(query);
        if (locations.isNotEmpty) {
          resultLatLng = LatLng(locations.first.latitude, locations.first.longitude);
        }
      } catch (_) {
        // Native geocoding failed, fallback to OSM Nominatim
        final url = Uri.parse('https://nominatim.openstreetmap.org/search?q=${Uri.encodeComponent(query)}&format=json&limit=1');
        final response = await http.get(url, headers: {'User-Agent': 'budolPayApp/1.0'});
        if (response.statusCode == 200) {
          final data = json.decode(response.body) as List;
          if (data.isNotEmpty) {
            resultLatLng = LatLng(double.parse(data[0]['lat']), double.parse(data[0]['lon']));
          }
        }
      }

      if (resultLatLng != null) {
        final loc = resultLatLng;
        setState(() {
          _selectedLocation = loc;
        });
        _mapController.move(loc, 15.0);
        await _reverseGeocodeCoordinate(loc);
      } else {
        throw Exception('Location not found');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Address not found')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _getCurrentLocation() async {
    setState(() => _isLoading = true);
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw 'Location services are disabled.';
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw 'Location permissions are denied';
        }
      }

      if (permission == LocationPermission.deniedForever) {
        throw 'Location permissions are permanently denied';
      }

      Position position = await Geolocator.getCurrentPosition();
      LatLng currentLatLng = LatLng(position.latitude, position.longitude);
      
      setState(() {
        _selectedLocation = currentLatLng;
      });
      _mapController.move(currentLatLng, 15.0);
      _reverseGeocodeCoordinate(currentLatLng);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pin Your Address', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, _selectedLocation),
            child: const Text('CONFIRM', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _selectedLocation,
              initialZoom: 15.0,
              onTap: (tapPosition, latLng) {
                setState(() {
                  _selectedLocation = latLng;
                });
                _reverseGeocodeCoordinate(latLng);
              },
            ),
            children: [
              TileLayer(
                urlTemplate: _tileUrl,
                userAgentPackageName: 'com.budol.pay.mobile',
              ),
              MarkerLayer(
                markers: [
                  Marker(
                    point: _selectedLocation,
                    width: 80,
                    height: 80,
                    child: const Icon(
                      Icons.location_on,
                      color: Color(0xFFF43F5E),
                      size: 40,
                    ),
                  ),
                ],
              ),
            ],
          ),
          Positioned(
            bottom: 20,
            right: 20,
            child: Column(
              children: [
                FloatingActionButton(
                  heroTag: 'my_location',
                  onPressed: _getCurrentLocation,
                  backgroundColor: const Color(0xFF0F172A),
                  child: _isLoading 
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Icon(Icons.my_location, color: Colors.white),
                ),
                const SizedBox(height: 10),
                FloatingActionButton(
                  heroTag: 'confirm_location',
                  onPressed: () => Navigator.pop(context, _selectedLocation),
                  backgroundColor: const Color(0xFFF43F5E),
                  child: const Icon(Icons.check, color: Colors.white),
                ),
              ],
            ),
          ),
          Positioned(
            top: 20,
            left: 20,
            right: 20,
            child: Card(
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
                child: TextField(
                  controller: _searchController,
                  textInputAction: TextInputAction.search,
                  decoration: InputDecoration(
                    hintText: 'Search for places...',
                    border: InputBorder.none,
                    icon: const Icon(Icons.search, color: Color(0xFFF43F5E)),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.clear, color: Colors.grey),
                      onPressed: () {
                        _searchController.clear();
                      },
                    ),
                  ),
                  onSubmitted: _geocodeAddress,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
