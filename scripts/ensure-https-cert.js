const fs = require("fs");
const os = require("os");
const path = require("path");
const selfsigned = require("selfsigned");

const certDir = path.join(__dirname, "..", "certs");
const certPath = path.join(certDir, "ocean-demo-local.crt");
const keyPath = path.join(certDir, "ocean-demo-local.key");
const publicCertPath = path.join(certDir, "ocean-demo-local.cer");

const getLanIPv4Addresses = () => {
    const interfaces = os.networkInterfaces();
    const addresses = new Set(["127.0.0.1"]);

    for (const values of Object.values(interfaces)) {
        for (const info of values || []) {
            if (info.family === "IPv4" && !info.internal) {
                addresses.add(info.address);
            }
        }
    }

    return Array.from(addresses);
};

const toDerBuffer = (pem) => {
    const base64 = pem
        .replace(/-----BEGIN CERTIFICATE-----/g, "")
        .replace(/-----END CERTIFICATE-----/g, "")
        .replace(/\s+/g, "");

    return Buffer.from(base64, "base64");
};

const main = () => {
    fs.mkdirSync(certDir, { recursive: true });

    if (fs.existsSync(certPath) && fs.existsSync(keyPath) && fs.existsSync(publicCertPath)) {
        console.log("HTTPS certificate already exists.");
        console.log(`Certificate file: ${publicCertPath}`);
        return;
    }

    const lanAddresses = getLanIPv4Addresses();
    const altNames = [
        { type: 2, value: "localhost" },
        { type: 7, ip: "127.0.0.1" },
        ...lanAddresses
            .filter((address) => address !== "127.0.0.1")
            .map((address) => ({ type: 7, ip: address })),
    ];

    const pems = selfsigned.generate(
        [{ name: "commonName", value: "OceanDemo Local HTTPS" }],
        {
            algorithm: "sha256",
            days: 3650,
            keySize: 2048,
            extensions: [
                {
                    name: "basicConstraints",
                    cA: true,
                },
                {
                    name: "keyUsage",
                    keyCertSign: true,
                    digitalSignature: true,
                    keyEncipherment: true,
                },
                {
                    name: "extKeyUsage",
                    serverAuth: true,
                    clientAuth: true,
                },
                {
                    name: "subjectAltName",
                    altNames,
                },
            ],
        }
    );

    fs.writeFileSync(certPath, pems.cert, "utf8");
    fs.writeFileSync(keyPath, pems.private, "utf8");
    fs.writeFileSync(publicCertPath, toDerBuffer(pems.cert));

    console.log("HTTPS certificate created.");
    console.log(`Certificate file: ${publicCertPath}`);
};

main();

