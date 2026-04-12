import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';

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
  bool _isSearching = false;

  String get _tileUrl {
    final provider = widget.settings?['mapProvider'] ?? 'OSM';
    switch (provider) {
      case 'GEOAPIFY':
        final apiKey = widget.settings?['geoapifyApiKey'] ?? '';
        return 'https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}.png?apiKey=$apiKey';
      case 'GOOGLE':
        // Note: Flutter Map doesn't natively support Google Maps tiles easily without extra plugins or specific URL formats
        return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      case 'RADAR':
        return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      default:
        return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  }

  @override
  void initState() {
    super.initState();
    _selectedLocation = widget.initialLocation ?? const LatLng(14.5995, 120.9842); // Default to Manila
    _reverseGeocode(_selectedLocation);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _reverseGeocode(LatLng latLng) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(latLng.latitude, latLng.longitude);
      if (placemarks.isNotEmpty) {
        final place = placemarks.first;
        final addressParts = [
          place.street,
          place.subLocality,
          place.locality,
          place.administrativeArea,
          place.postalCode,
          place.country,
        ].where((part) => part != null && part.isNotEmpty).toList();
        
        if (mounted) {
          setState(() {
            _searchController.text = addressParts.join(', ');
          });
        }
      }
    } catch (e) {
      debugPrint("Reverse geocode error: $e");
    }
  }

  Future<void> _searchAddress(String query) async {
    if (query.isEmpty) return;
    FocusScope.of(context).unfocus(); // Dismiss keyboard
    setState(() => _isSearching = true);
    try {
      List<Location> locations = await locationFromAddress(query);
      if (locations.isNotEmpty) {
        final loc = locations.first;
        final latLng = LatLng(loc.latitude, loc.longitude);
        setState(() {
          _selectedLocation = latLng;
        });
        _mapController.move(latLng, 15.0);
        await _reverseGeocode(latLng);
      } else {
        if (mounted) {
           ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Address not found')));
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to search location: $e')));
      }
    } finally {
      if (mounted) setState(() => _isSearching = false);
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
      await _reverseGeocode(currentLatLng);
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
                _reverseGeocode(latLng);
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
                    ? const Padding(
                        padding: EdgeInsets.all(12.0),
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
                      )
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
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
                child: TextField(
                  controller: _searchController,
                  onSubmitted: _searchAddress,
                  decoration: InputDecoration(
                    hintText: 'Search for location...',
                    border: InputBorder.none,
                    icon: const Icon(Icons.search, color: Colors.grey),
                    suffixIcon: _isSearching 
                      ? const Padding(
                          padding: EdgeInsets.all(12.0),
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : IconButton(
                          icon: const Icon(Icons.arrow_forward),
                          onPressed: () => _searchAddress(_searchController.text),
                        ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

