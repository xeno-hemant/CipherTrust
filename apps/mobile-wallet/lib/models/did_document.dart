class DidDocumentModel {
  final String did;
  final String controllerAddress;
  final String publicKey;
  final String createdAt;
  final bool verified;

  DidDocumentModel({
    required this.did,
    required this.controllerAddress,
    required this.publicKey,
    required this.createdAt,
    required this.verified,
  });

  factory DidDocumentModel.fromJson(Map<String, dynamic> json) {
    return DidDocumentModel(
      did: json['did'] ?? '',
      controllerAddress: json['controllerAddress'] ?? '',
      publicKey: json['publicKey'] ?? '',
      createdAt: json['createdAt'] ?? '',
      verified: json['verified'] ?? true,
    );
  }
}
