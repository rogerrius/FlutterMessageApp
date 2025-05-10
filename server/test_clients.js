const WebSocket = require('ws');
const sodium = require('libsodium-wrappers');

async function init() {
    await sodium.ready;

    const client1 = new WebSocket('ws://localhost:8099');
    const client2 = new WebSocket('ws://localhost:8099');

    const keyPair1 = sodium.crypto_box_keypair();
    const keyPair2 = sodium.crypto_box_keypair();

    let pubkey2 = null;

    client1.on('open', () => {
        console.log('[Client1] Conectado');
        client1.send(JSON.stringify({
            type: 'auth',
            username: 'user1',
            pubkey: sodium.to_base64(keyPair1.publicKey)
        }));
    });

    client2.on('open', () => {
        console.log('[Client2] Conectado');
        client2.send(JSON.stringify({
            type: 'auth',
            username: 'user2',
            pubkey: sodium.to_base64(keyPair2.publicKey)
        }));
    });

    client1.on('message', msg => {
        const data = JSON.parse(msg);
        if (data.type === 'pubkey' && data.from === 'user2') {
            pubkey2 = sodium.from_base64(data.key);
            console.log('[Client1] Clave pública recibida de user2');

            // Cifrar mensaje
            const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
            const mensaje = Buffer.from("Hola desde user1!");
            const cifrado = sodium.crypto_box_easy(mensaje, nonce, pubkey2, keyPair1.privateKey);
            const paquete = Buffer.concat([nonce, cifrado]);

            client1.send(JSON.stringify({
                type: 'message',
                to: 'user2',
                content: sodium.to_base64(paquete)
            }));
            console.log('[Client1] Mensaje cifrado enviado a user2');
        }
    });

    client2.on('message', msg => {
        const data = JSON.parse(msg);
        if (data.type === 'message' && data.from === 'user1') {
            const paquete = sodium.from_base64(data.content);
            const nonce = paquete.slice(0, sodium.crypto_box_NONCEBYTES);
            const ciphertext = paquete.slice(sodium.crypto_box_NONCEBYTES);

            const mensajeDescifrado = sodium.crypto_box_open_easy(ciphertext, nonce, keyPair1.publicKey, keyPair2.privateKey);
            console.log('[Client2] Mensaje recibido y descifrado: ' + Buffer.from(mensajeDescifrado).toString());
        }
    });
}

init().catch(console.error);
