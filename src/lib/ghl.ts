export interface GHLContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

const GHL_API_BASE = "https://services.leadconnectorhq.com";

function getGHLHeaders() {
  const apiKey = process.env.GHL_API_KEY || process.env.GHL_LOCATION_KEY;
  const locationId = process.env.GHL_LOCATION_ID;

  return {
    Authorization: `Bearer ${apiKey}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
    ...(locationId ? { LocationId: locationId } : {}),
  };
}

/**
 * Busca um participante no GoHighLevel pelo número de telefone
 */
export async function findGHLContactByPhone(phone: string): Promise<GHLContact | null> {
  const apiKey = process.env.GHL_API_KEY || process.env.GHL_LOCATION_KEY;
  if (!apiKey) {
    console.warn("⚠️ GHL_API_KEY não configurada no .env. Não foi possível consultar o GHL.");
    return null;
  }

  try {
    const cleanPhone = phone.replace(/\D/g, "");
    const locationId = process.env.GHL_LOCATION_ID || "";
    
    // Testar busca por consulta de telefone no GHL CRM API v2
    const searchUrl = `${GHL_API_BASE}/contacts/?query=${encodeURIComponent(cleanPhone)}&locationId=${locationId}`;

    const res = await fetch(searchUrl, {
      method: "GET",
      headers: getGHLHeaders(),
    });

    if (!res.ok) {
      console.error(`Erro ao buscar contato no GHL (Status ${res.status}):`, await res.text());
      return null;
    }

    const data = await res.json();
    if (data.contacts && data.contacts.length > 0) {
      const c = data.contacts[0];
      const fullName = c.contactName || `${c.firstName || ""} ${c.lastName || ""}`.trim();
      return {
        id: c.id,
        name: fullName || "Participante Sem Nome",
        phone: c.phone || phone,
        email: c.email,
        tags: c.tags || [],
      };
    }

    return null;
  } catch (error) {
    console.error("Exceção ao buscar contato no GHL:", error);
    return null;
  }
}

/**
 * Atualiza o contato no GHL com os links das cartas enviadas
 */
export async function updateGHLContactLetters(
  contactId: string,
  remitterName: string,
  relationship: string,
  letterUrls: string[]
): Promise<boolean> {
  const apiKey = process.env.GHL_API_KEY || process.env.GHL_LOCATION_KEY;
  if (!apiKey) {
    console.warn("⚠️ GHL_API_KEY não configurada. Atualização do GHL ignorada.");
    return false;
  }

  try {
    const customFieldKey = process.env.GHL_CARTAS_FIELD_ID || "lista_de_cartas";

    // 1. Obter contato existente para ler o campo atual
    const getRes = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, {
      method: "GET",
      headers: getGHLHeaders(),
    });

    let currentCartasText = "";
    if (getRes.ok) {
      const existingData = await getRes.json();
      const existingFields = existingData.contact?.customFields || [];
      const cartaField = existingFields.find((f: any) => f.id === customFieldKey || f.key === customFieldKey);
      if (cartaField && cartaField.value) {
        currentCartasText = cartaField.value;
      }
    }

    // 2. Formatar novas linhas de cartas
    const dateStr = new Date().toLocaleDateString("pt-BR");
    const newEntries = letterUrls
      .map((url, idx) => `- [${dateStr}] ${remitterName} (${relationship}) - Carta ${idx + 1}: ${url}`)
      .join("\n");

    const updatedCartasText = currentCartasText
      ? `${currentCartasText}\n${newEntries}`
      : newEntries;

    // 3. Atualizar contato com nova lista e tag 'CARTA_RECEBIDA'
    const updatePayload = {
      tags: ["CARTA_RECEBIDA", "CARTA_ENVIADA"],
      customFields: [
        {
          id: customFieldKey,
          value: updatedCartasText,
        },
      ],
    };

    const updateRes = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, {
      method: "PUT",
      headers: getGHLHeaders(),
      body: JSON.stringify(updatePayload),
    });

    if (!updateRes.ok) {
      console.error(`Erro ao atualizar contato no GHL: ${updateRes.status}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erro ao registrar cartas no GHL:", error);
    return false;
  }
}
