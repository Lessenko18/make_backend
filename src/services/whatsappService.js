import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_PATH = path.resolve(__dirname, "../../.whatsapp-session");

let sock = null;
let ready = false;

const formatPhone = (raw) => {
  const digits = raw.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
};

// Logger silencioso compatível com o que Baileys espera
const silentLogger = {
  level: "silent",
  trace: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {},
  child: () => silentLogger,
};

const connect = async () => {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_PATH);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: state,
      logger: silentLogger,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        console.log("[WhatsApp] Escaneie o QR code abaixo com o WhatsApp:");
        qrcode.generate(qr, { small: true });
      }
      if (connection === "close") {
        ready = false;
        const code = lastDisconnect?.error?.output?.statusCode;
        if (code !== DisconnectReason.loggedOut) {
          console.log("[WhatsApp] Reconectando...");
          connect();
        } else {
          console.log(
            "[WhatsApp] Deslogado. Delete a pasta .whatsapp-session e reinicie o servidor."
          );
        }
      } else if (connection === "open") {
        ready = true;
        console.log("[WhatsApp] Conectado e pronto para enviar mensagens ✓");
      }
    });
  } catch (e) {
    console.error("[WhatsApp] Erro ao inicializar:", e.message);
  }
};

export const sendWhatsApp = async (phone, message) => {
  if (!ready || !sock) {
    console.warn(`[WhatsApp] Não conectado – mensagem para ${phone} ignorada`);
    return;
  }
  try {
    const jid = `${formatPhone(phone)}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: message });
    console.log(`[WhatsApp] Mensagem enviada para ${phone}`);
  } catch (e) {
    console.error(`[WhatsApp] Falha ao enviar para ${phone}:`, e.message);
  }
};

export const initWhatsApp = connect;
