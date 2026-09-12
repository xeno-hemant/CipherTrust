import 'package:flutter/material.dart';
import 'screens/connect_wallet_screen.dart';
import 'screens/my_did_screen.dart';
import 'screens/my_assets_screen.dart';

void main() {
  runApp(const CipherTrustApp());
}

class CipherTrustApp extends StatelessWidget {
  const CipherTrustApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CipherTrust Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primarySwatch: Colors.indigo,
        useMaterial3: true,
      ),
      home: const MainNavigationWrapper(),
    );
  }
}

class MainNavigationWrapper extends StatefulWidget {
  const MainNavigationWrapper({Key? key}) : super(key: key);

  @override
  State<MainNavigationWrapper> createState() => _MainNavigationWrapperState();
}

class _MainNavigationWrapperState extends State<MainNavigationWrapper> {
  String? _connectedAddress;
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    if (_connectedAddress == null) {
      return ConnectWalletScreen(
        onConnected: (address) {
          setState(() {
            _connectedAddress = address;
          });
        },
      );
    }

    final pages = [
      MyDidScreen(address: _connectedAddress!),
      MyAssetsScreen(address: _connectedAddress!),
    ];

    return Scaffold(
      body: pages[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        backgroundColor: const Color(0xFF0F172A),
        selectedItemColor: const Color(0xFF818CF8),
        unselectedItemColor: Colors.grey,
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.badge), label: 'DID Profile'),
          BottomNavigationBarItem(icon: Icon(Icons.layers), label: 'Assets'),
        ],
      ),
    );
  }
}
