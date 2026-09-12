import 'convert';
import 'package:http/http.dart' as http;
import '../config.dart';
import '../models/did_document.dart';
import '../models/nft_asset.dart';

class ApiService {
  final String baseUrl;

  ApiService({this.baseUrl = AppConfig.baseUrl});

  Future<DidDocumentModel?> getDid(String addressOrDid) async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/did/$addressOrDid'));
      if (res.statusCode == 200) {
        return DidDocumentModel.fromJson(jsonDecode(res.body));
      }
    } catch (e) {
      print('ApiService.getDid error: $e');
    }
    return null;
  }

  Future<List<NftAssetModel>> getInventory(String didOrAddress) async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/nft/inventory/$didOrAddress'));
      if (res.statusCode == 200) {
        final List<dynamic> data = jsonDecode(res.body);
        return data.map((item) => NftAssetModel.fromJson(item)).toList();
      }
    } catch (e) {
      print('ApiService.getInventory error: $e');
    }
    return [];
  }
}
