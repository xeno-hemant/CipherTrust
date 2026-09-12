import 'package:flutter/material.dart';
import '../models/nft_asset.dart';
import '../services/api_service.dart';

class MyAssetsScreen extends StatefulWidget {
  final String address;

  const MyAssetsScreen({Key? key, required this.address}) : super(key: key);

  @override
  State<MyAssetsScreen> createState() => _MyAssetsScreenState();
}

class _MyAssetsScreenState extends State<MyAssetsScreen> {
  final ApiService _apiService = ApiService();
  List<NftAssetModel> _assets = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadInventory();
  }

  Future<void> _loadInventory() async {
    setState(() => _loading = true);
    final items = await _apiService.getInventory(widget.address);
    setState(() {
      _assets = items;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0E17),
      appBar: AppBar(
        title: const Text('Digital Assets'),
        backgroundColor: const Color(0xFF0F172A),
        actions: [
          IconButton(onPressed: _loadInventory, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : _assets.isEmpty
              ? const Center(
                  child: Text('No digital assets found.', style: TextStyle(color: Colors.grey)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _assets.length,
                  itemBuilder: (context, index) {
                    final asset = _assets[index];
                    final name = asset.metadata['name'] ?? 'Token #${asset.tokenId}';
                    final desc = asset.metadata['description'] ?? '';
                    return Card(
                      color: const Color(0xFF1E293B),
                      margin: const EdgeInsets.only(bottom: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      child: ListTile(
                        leading: const CircleAvatar(
                          backgroundColor: Color(0xFF4F46E5),
                          child: Icon(Icons.token, color: Colors.white),
                        ),
                        title: Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        subtitle: Text(desc, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.grey)),
                        trailing: Text('#${asset.tokenId}', style: const TextStyle(color: Color(0xFF818CF8), fontWeight: FontWeight.bold)),
                      ),
                    );
                  },
                ),
    );
  }
}
