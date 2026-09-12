class NftAssetModel {
  final String tokenId;
  final String contractAddress;
  final String ownerDid;
  final String metadataUri;
  final Map<String, dynamic> metadata;
  final String mintedBy;
  final String mintedAt;

  NftAssetModel({
    required this.tokenId,
    required this.contractAddress,
    required this.ownerDid,
    required this.metadataUri,
    required this.metadata,
    required this.mintedBy,
    required this.mintedAt,
  });

  factory NftAssetModel.fromJson(Map<String, dynamic> json) {
    return NftAssetModel(
      tokenId: json['tokenId'] ?? '',
      contractAddress: json['contractAddress'] ?? '',
      ownerDid: json['ownerDid'] ?? '',
      metadataUri: json['metadataUri'] ?? '',
      metadata: json['metadata'] ?? {},
      mintedBy: json['mintedBy'] ?? '',
      mintedAt: json['mintedAt'] ?? '',
    );
  }
}
