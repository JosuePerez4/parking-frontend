const API_BASE = "http://localhost:3000";

// ── Settings ───────────────────────────────────────────────────────────────
export interface AppSettings {
  id: number;
  fraccionCarro: number;
  horaCarro: number;
  medioDiaCarro: number;
  diaCarro: number;
  mensualidadCarro: number;
  fraccionMoto: number;
  horaMoto: number;
  medioDiaMoto: number;
  diaMoto: number;
  mensualidadMoto: number;
}

export async function getSettings(): Promise<AppSettings> {
  const res = await fetch(`${API_BASE}/settings`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar configuración");
  return res.json();
}

export async function updateSettings(data: Partial<AppSettings>): Promise<AppSettings> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al guardar configuración");
  return res.json();
}

// ── Clients ────────────────────────────────────────────────────────────────
export interface Client {
  id: number;
  fullName: string;
  document: string;
  phone: string;
  email: string;
  address: string;
  status: "active" | "inactive" | "blocked";
  createdAt: string;
}

export interface CreateClientDto {
  fullName: string;
  document: string;
  phone: string;
  email: string;
  address: string;
}

export async function getClients(): Promise<Client[]> {
  const res = await fetch(`${API_BASE}/clients`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar clientes");
  return res.json();
}

export interface UpdateClientDto {
  fullName?: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: "active" | "inactive" | "blocked";
}

export async function updateClient(id: number, data: UpdateClientDto): Promise<Client> {
  const res = await fetch(`${API_BASE}/clients/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al actualizar cliente");
  }
  return res.json();
}

export async function createClient(data: CreateClientDto): Promise<Client> {
  const res = await fetch(`${API_BASE}/clients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al crear cliente");
  }
  return res.json();
}

export async function deleteClient(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/clients/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al eliminar cliente");
  }
}

// ── Vehicles ───────────────────────────────────────────────────────────────
export interface Vehicle {
  id: number;
  clientId: number;
  plate: string;
  type: "car" | "moto" | "truck";
  brand: string;
  color: string;
  status: "active" | "inactive";
  createdAt: string;
  client?: {
    id: number;
    fullName: string;
    document: string;
    phone: string;
  };
  membership?: {
    id: number;
    status: "active" | "expired" | "cancelled";
    endDate: string;
  };
}

export interface CreateVehicleDto {
  clientId: number;
  plate: string;
  type: "car" | "moto" | "truck";
  brand?: string;
  color?: string;
}

export async function getVehicles(): Promise<Vehicle[]> {
  const res = await fetch(`${API_BASE}/vehicles`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar vehículos");
  return res.json();
}

export async function createVehicle(data: CreateVehicleDto): Promise<Vehicle> {
  const res = await fetch(`${API_BASE}/vehicles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al crear vehículo");
  }
  return res.json();
}

export async function assignVehicleClient(vehicleId: number, clientId: number): Promise<Vehicle> {
  const res = await fetch(`${API_BASE}/vehicles/${vehicleId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId }),
  });
  if (!res.ok) throw new Error("Error al asignar cliente");
  return res.json();
}

export async function updateVehicle(
  id: number,
  data: { clientId?: number; brand?: string; color?: string },
): Promise<Vehicle> {
  const res = await fetch(`${API_BASE}/vehicles/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al actualizar vehículo");
  }
  return res.json();
}

export async function deleteVehicle(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/vehicles/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al eliminar vehículo");
  }
}

// ── Parking ────────────────────────────────────────────────────────────────
export interface ActiveVehicle {
  id: number;
  plate: string;
  vehicleType: string;
  entryTime: string;
  currentMinutes: number;
  duration: string;
  estimatedCost: number;
}

export async function getActiveVehicles(): Promise<ActiveVehicle[]> {
  const res = await fetch(`${API_BASE}/parking/active`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar parking activo");
  return res.json();
}

export async function exitVehicle(plate: string): Promise<{
  plate: string;
  duration: string;
  totalMinutes: number;
  amountToPay: number;
}> {
  const res = await fetch(`${API_BASE}/parking/exit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plate }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al registrar salida");
  }
  return res.json();
}

// ── Entries ────────────────────────────────────────────────────────────────
export interface Entry {
  id: number;
  plate: string;
  entryTime: string;
  exitTime: string | null;
  amountPaid: number | null;
  vehicleType: string | null;
}

export async function getEntries(): Promise<Entry[]> {
  const res = await fetch(`${API_BASE}/entries`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar historial");
  return res.json();
}

// ── Memberships ────────────────────────────────────────────────────────────
export interface Membership {
  id: number;
  vehicleId: number;
  clientId: number;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "cancelled";
  price: string;
  autoRenew: boolean;
  company: string | null;
  createdAt: string;
  vehicle?: {
    id: number;
    plate: string;
    type: "car" | "moto" | "truck";
    brand: string;
    color: string;
  };
  client?: {
    id: number;
    fullName: string;
    document: string;
    phone: string;
    email: string;
  };
}

export interface CreateMembershipDto {
  vehicleId: number;
  clientId: number;
  startDate: string;
  endDate: string;
  price: number;
  autoRenew?: boolean;
  company?: string;
}

export async function getMemberships(): Promise<Membership[]> {
  const res = await fetch(`${API_BASE}/memberships`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar mensualidades");
  return res.json();
}

export async function createMembership(data: CreateMembershipDto): Promise<Membership> {
  const res = await fetch(`${API_BASE}/memberships`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al crear mensualidad");
  }
  return res.json();
}

export async function getExpiringMemberships(): Promise<Membership[]> {
  const res = await fetch(`${API_BASE}/memberships/expiring`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar mensualidades por vencer");
  return res.json();
}

export async function renewMembership(id: number): Promise<Membership> {
  const res = await fetch(`${API_BASE}/memberships/${id}/renew`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Error al renovar mensualidad");
  return res.json();
}

export async function deleteMembership(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/memberships/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al eliminar mensualidad");
  }
}

// ── Reports / Caja ─────────────────────────────────────────────────────────
export interface CajaCobroRow {
  placa: string;
  tipo: string;
  esMensualidad: boolean;
  horaEntrada: string;
  horaSalida: string;
  duracion: string;
  monto: number;
}

export interface CajaReport {
  fecha: string;
  totalCOP: number;
  totalVehiculos: number;
  visitantes: number;
  mensualidades: number;
  desglosePorHora: { hora: string; cantidad: number }[];
  cobros: CajaCobroRow[];
}

export async function getCajaReport(fecha: string): Promise<CajaReport> {
  const res = await fetch(`${API_BASE}/reports/caja?fecha=${fecha}`, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Error al generar cierre de caja");
  }
  return res.json();
}
