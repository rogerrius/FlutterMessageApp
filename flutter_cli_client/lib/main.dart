import 'dart:ffi';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:sodium/sodium.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // ✅ Inicializa sodium con una función anónima (no directamente)
  final sodium = await SodiumInit.init(() => DynamicLibrary.open('libsodium.so'));

  runApp(MyApp(sodium));
}

class MyApp extends StatelessWidget {
  final Sodium sodium;
  MyApp(this.sodium, {super.key});

  @override
  Widget build(BuildContext context) {
    // ✅ Genera par de llaves
    final keyPair = sodium.crypto.box.keyPair();
    final peerKeyPair = sodium.crypto.box.keyPair(); // Llave pública del otro lado

    // ✅ Crea un nonce aleatorio
    final nonce = sodium.randombytes.buf(sodium.crypto.box.nonceBytes);

    // ✅ Mensaje original
    final message = Uint8List.fromList('Hola desde Flutter con sodium!'.codeUnits);

    final cipher = sodium.crypto.box.easy(
      message: message,
      nonce: nonce,
      publicKey: peerKeyPair.publicKey,
      secretKey: keyPair.secretKey,
    );

    final decrypted = sodium.crypto.box.openEasy(
      cipherText: cipher,
      nonce: nonce,
      publicKey: keyPair.publicKey,
      secretKey: peerKeyPair.secretKey,
    );

    final mensajeFinal = String.fromCharCodes(decrypted);

    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: const Text('Sodium Encryption')),
        body: Center(child: Text('Mensaje descifrado: $mensajeFinal')),
      ),
    );
  }
}
