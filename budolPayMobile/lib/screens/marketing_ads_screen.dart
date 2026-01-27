import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:provider/provider.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import '../services/api_service.dart';
import '../constants/routes.dart';
import '../utils/ui_utils.dart';
import '../utils/js_helper.dart';

class MarketingAdsScreen extends StatefulWidget {
  const MarketingAdsScreen({super.key});

  @override
  State<MarketingAdsScreen> createState() => _MarketingAdsScreenState();
}

class _MarketingAdsScreenState extends State<MarketingAdsScreen> {
  late PageController _pageController;
  int _currentPage = 0;
  Timer? _timer;

  final List<Map<String, dynamic>> _slides = [
    {
      'title': 'budolLoan',
      'description': 'Quick and easy cash loans with flexible terms. Get approved within 2 days with budolLoan',
      'icon': Icons.account_balance_wallet_outlined,
      'color': const Color(0xFF3B82F6), // Blue
    },
    {
      'title': 'budolShap',
      'description': 'Exclusive deals and marketplace finds. Shop the best products at budolShap',
      'icon': Icons.shopping_bag_outlined,
      'color': const Color(0xFF10B981), // Emerald
    },
    {
      'title': 'budolExpress',
      'description': 'Fast and reliable delivery and transport services. Move anything with budolExpress!',
      'icon': Icons.local_shipping_outlined,
      'color': const Color(0xFFF59E0B), // Amber
    },
    {
      'title': 'budol₱ay',
      'description': 'Your secure digital wallet for seamless payments and transfers across the budolEcosystem.',
      'icon': '₱',
      'color': const Color(0xFFF43F5E), // Rose (budol₱ay Branding)
    },
    {
      'title': 'budolAkawntng',
      'description': 'The central command system hub that monitors and audits financial transactions across the budolEcosystem. Get deep insights and analysis with budolAkawntng.',
      'icon': Icons.assessment_outlined,
      'color': const Color(0xFFA855F7), // Purple 500
    },
  ];

  @override
  void initState() {
    super.initState();
    debugPrint('MarketingAdsScreen: initState - Initializing controller and timer');
    _pageController = PageController(initialPage: 0);
    
    // Auto-scroll logic
    WidgetsBinding.instance.addPostFrameCallback((_) {
      debugPrint('MarketingAdsScreen: postFrameCallback - Checking clients');
      if (mounted) {
        // On Web, signal that we are ready to remove the HTML splash
        if (kIsWeb) {
          debugPrint('MarketingAdsScreen: Web ready - Removing splash via JS');
          // Give the engine one more frame to paint
          Future.delayed(const Duration(milliseconds: 100), () {
            if (mounted) {
              importJsMethod('removeSplashFromWeb');
              callJsMethod('removeSplashFromWeb');
            }
          });
        }

        // Ensure web rendering is stable
        Future.delayed(const Duration(milliseconds: 100), () {
          if (mounted && _pageController.hasClients) {
            debugPrint('MarketingAdsScreen: starting auto-scroll timer');
            _startTimer();
          }
        });
      }
    });
  }

  // Helper for JS method calling
  void importJsMethod(String methodName) {
    try {
      // This is a no-op if using the existing js_helper.dart
    } catch (e) {
      debugPrint('JS Helper error: $e');
    }
  }

  @override
  void dispose() {
    debugPrint('MarketingAdsScreen: dispose');
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 5), (timer) {
      if (!mounted) return;
      if (!_pageController.hasClients) return;
      
      if (_currentPage < _slides.length - 1) {
        _pageController.nextPage(
          duration: const Duration(milliseconds: 600),
          curve: Curves.easeInOut,
        );
      } else {
        _pageController.animateToPage(
          0,
          duration: const Duration(milliseconds: 800),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  void _onNext() {
    // Reset timer when manually navigating
    _startTimer();
    
    if (_currentPage < _slides.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    } else {
      // Loop back to start if manually clicking next on last page
      _pageController.animateToPage(
        0,
        duration: const Duration(milliseconds: 600),
        curve: Curves.easeInOut,
      );
    }
  }

  void _proceedToApp() async {
    final apiService = context.read<ApiService>();
    
    // Mark ads as seen
    await apiService.setHasSeenAds(true);
    
    // The user explicitly requested to go to the Login UI instead of the Home screen
    // when clicking "Get Started" or "Skip" to ensure proper authentication flow.
    debugPrint('MarketingAdsScreen: Proceeding to Login UI...');

    if (mounted) {
      Navigator.pushReplacementNamed(context, Routes.login);
    }
  }

  @override
  Widget build(BuildContext context) {
    debugPrint('MarketingAdsScreen: build() called - kIsWeb: $kIsWeb');
    
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: Material(
        color: const Color(0xFF0F172A),
        child: LayoutBuilder(
          builder: (context, constraints) {
            // Robust size detection for Web
            final double maxWidth = constraints.maxWidth;
            final double maxHeight = constraints.maxHeight;
            
            debugPrint('MarketingAdsScreen: Layout constraints: $maxWidth x $maxHeight');
            
            if (maxWidth == 0 || maxHeight == 0) {
               debugPrint('MarketingAdsScreen: WARNING - Zero size detected!');
               return const SizedBox.shrink();
            }

            final double width = maxWidth.isFinite && maxWidth > 0 
                ? maxWidth 
                : 393;
            final double height = maxHeight.isFinite && maxHeight > 0 
                ? maxHeight 
                : 780;
            
            debugPrint('MarketingAdsScreen: Layout determined: ${width.toInt()}x${height.toInt()}');
            
            return Container(
              width: width,
              height: height,
              decoration: const BoxDecoration(
                color: Color(0xFF0F172A),
              ),
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  // Primary Content
                  Positioned.fill(
                    child: PageView.builder(
                      key: const ValueKey('marketing_page_view_v4'),
                      controller: _pageController,
                      physics: const ClampingScrollPhysics(),
                      onPageChanged: (index) {
                        if (mounted) {
                          setState(() {
                            _currentPage = index;
                          });
                          debugPrint('MarketingAdsScreen: Page changed to $index');
                        }
                      },
                      itemCount: _slides.length,
                      itemBuilder: (context, index) {
                        debugPrint('MarketingAdsScreen: Building slide $index');
                        return _buildSlide(_slides[index]);
                      },
                    ),
                  ),
                  
                  // Overlay UI (Indicators, Buttons, etc.)
                  _buildOverlayUI(width, height),
                  
                  // Diagnostic Overlay (only in debug)
                  if (kDebugMode)
                    Positioned(
                      top: 10,
                      left: 10,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        color: Colors.black54,
                        child: const Text('ADS_RENDER_ACTIVE', style: TextStyle(color: Colors.green, fontSize: 8)),
                      ),
                    ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildOverlayUI(double width, double height) {
    // Safety check for small dimensions
    final bool showFullUI = height > 400;
    
    return Stack(
      clipBehavior: Clip.none,
      children: [
        // Pagination Indicators
        if (showFullUI)
          Positioned(
            bottom: height * 0.15, // Relative positioning
            left: 0,
            right: 0,
            child: Center(
              child: SmoothPageIndicator(
                controller: _pageController,
                count: _slides.length,
                effect: const ExpandingDotsEffect(
                  dotHeight: 8,
                  dotWidth: 8,
                  expansionFactor: 3,
                  spacing: 8,
                  dotColor: Colors.white24,
                  activeDotColor: Color(0xFFF43F5E),
                ),
              ),
            ),
          ),

        // Action Buttons
        Positioned(
          bottom: showFullUI ? 40 : 10,
          left: 24,
          right: 24,
          child: Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: _onNext,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white10,
                    foregroundColor: Colors.white,
                    padding: EdgeInsets.symmetric(vertical: showFullUI ? 16 : 8),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: Text(showFullUI ? 'NEXT' : '>', style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ElevatedButton(
                  onPressed: _proceedToApp,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFF43F5E),
                    foregroundColor: Colors.white,
                    padding: EdgeInsets.symmetric(vertical: showFullUI ? 16 : 8),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: Text(showFullUI ? 'GET STARTED' : 'START', style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),

        // Skip Button
        Positioned(
          top: showFullUI ? 50 : 20,
          right: 16,
          child: TextButton(
            onPressed: _proceedToApp,
            child: const Text('Skip', style: TextStyle(color: Colors.white54)),
          ),
        ),

        // Debug info for dev
        if (kDebugMode)
          Positioned(
            top: showFullUI ? 40 : 10,
            right: 80,
            child: Container(
              padding: const EdgeInsets.all(4),
              color: Colors.black54,
              child: Text('OK_${width.toInt()}x${height.toInt()}', 
                style: const TextStyle(color: Colors.green, fontSize: 10)),
            ),
          ),
      ],
    );
  }

  Widget _buildSlide(Map<String, dynamic> slide) {
    return Container(
      key: ValueKey(slide['title']), // Ensure unique rendering
      padding: const EdgeInsets.all(40),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(30),
            decoration: BoxDecoration(
              color: (slide['color'] as Color).withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: slide['icon'] is IconData
                ? Icon(slide['icon'] as IconData, size: 80, color: slide['color'])
                : Text(
                    slide['icon'].toString(),
                    style: TextStyle(
                      fontSize: 80,
                      fontWeight: FontWeight.bold,
                      color: slide['color'],
                    ),
                  ),
          ),
          const SizedBox(height: 48),
          UIUtils.formatBudolPayText(
            slide['title'],
            baseStyle: const TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 24),
          UIUtils.formatBudolPayText(
            slide['description'],
            baseStyle: const TextStyle(
              fontSize: 18,
              color: Colors.white70,
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  /* Removed unused _buildDescription helper in v484 */
  /*
  Widget _buildDescription(String description) {
    final List<TextSpan> spans = [];
    final RegExp regExp = RegExp(r'(budol)(Pay|₱ay|Ecosystem|Shap|Loan|Express|ID|Akawntng)?', caseSensitive: false);
    
    int lastMatchEnd = 0;
    for (final match in regExp.allMatches(description)) {
      // Add text before match
      if (match.start > lastMatchEnd) {
        spans.add(TextSpan(text: description.substring(lastMatchEnd, match.start)));
      }

      // Add "budol" part
      spans.add(const TextSpan(
        text: 'budol',
        style: TextStyle(
          color: Color(0xFF94A3B8), // Slate 400
          fontWeight: FontWeight.w600,
        ),
      ));

      // Add suffix part if it exists
      if (match.group(2) != null) {
        String suffix = match.group(2)!;
        Color suffixColor = const Color(0xFFF43F5E); // Default Rose

        String lowerSuffix = suffix.toLowerCase();
        if (lowerSuffix == 'pay' || lowerSuffix == '₱ay') {
          suffix = '₱ay';
          suffixColor = const Color(0xFFF43F5E);
        } else if (lowerSuffix == 'ecosystem') {
          suffixColor = const Color(0xFF64748B); // Slate 500
        } else if (lowerSuffix == 'loan') {
          suffixColor = const Color(0xFF3B82F6); // Blue
        } else if (lowerSuffix == 'express') {
          suffixColor = const Color(0xFFF59E0B); // Amber
        } else if (lowerSuffix == 'id') {
          suffixColor = const Color(0xFF8B5CF6); // Violet
        } else if (lowerSuffix == 'akawntng') {
          suffixColor = const Color(0xFFA855F7); // Purple
        }

        spans.add(TextSpan(
          text: suffix,
          style: TextStyle(
            color: suffixColor,
            fontWeight: FontWeight.bold,
          ),
        ));
      }

      lastMatchEnd = match.end;
    }

    // Add remaining text
    if (lastMatchEnd < description.length) {
      spans.add(TextSpan(text: description.substring(lastMatchEnd)));
    }

    return Text.rich(
      TextSpan(
        style: const TextStyle(
          color: Colors.white70,
          fontSize: 16,
          height: 1.5,
        ),
        children: spans,
      ),
      textAlign: TextAlign.center,
    );
  }
  */
}
