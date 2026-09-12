import 'package:flutter/material.dart';
import '../models/did_document.dart';
import '../services/api_service.dart';

class MyDidScreen extends StatefulWidget {
  final String address;

  const MyDidScreen({Key? key, required this.address}) : super(key: key);

  @override
  State<MyDidScreen> createState() => _MyDidScreenState();
}

class _MyDidScreenState extends State<MyDidScreen> {
  final ApiService _apiService = ApiService();
  DidDocumentModel? _didDoc;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadDid();
  }

  Future<void> _loadDid() async {
    setState(() => _loading = true);
    final doc = await _apiService.getDid(widget.address);
    setState(() {
      _didDoc = doc;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0E17),
      appBar: AppBar(
        title: const Text('My Decentralized Identity'),
        backgroundColor: const Color(0xFF0F172A),
        actions: [
          IconButton(onPressed: _loadDid, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Card(
                    color: const Color(0xFF1E293B),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: const [
                              Icon(Icons.verified, color: Colors.greenAccent),
                              SizedBox(width: 8),
                              Text(
                                'Verified DID Profile',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                              ),
                            ],
                          ),
                          const Divider(color: Colors.white12, height: 24),
                          const Text('DID String', style: TextStyle(color: Colors.grey, fontSize: 12)),
                          const SizedBox(height: 4),
                          SelectableText(
                            _didDoc?.did ?? 'did:ethr:31337:${widget.address}',
                            style: const TextStyle(color: Color(0xFF818CF8), fontFamily: 'monospace', fontSize: 13),
                          ),
                          const SizedBox(height: 16),
                          const Text('Controller Address', style: TextStyle(color: Colors.grey, fontSize: 12)),
                          const SizedBox(height: 4),
                          SelectableText(
                            _didDoc?.controllerAddress ?? widget.address,
                            style: const TextStyle(color: Colors.white70, fontFamily: 'monospace', fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
