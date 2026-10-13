import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore 
} from 'firebase/firestore';
import { 
  getDatabase, 
  ref, 
  onValue, 
  set, 
  update, 
  get,
  Database 
} from 'firebase/database';
import { getAuth } from 'firebase/auth';

import firebaseConfig from '../../firebase-applet-config.json';
import { 
  SensorDevice, 
  UserProfile, 
  DeviceRental,
  UserRole
} from '../types';

export const USER_RTDB_URL = "https://minefase-fc5f5-default-rtdb.firebaseio.com/";

// Initialize Firebase App
const appConfig = {
  ...firebaseConfig,
  databaseURL: USER_RTDB_URL,
};

const app = !getApps().length ? initializeApp(appConfig) : getApp();

// Firebase Realtime Database connected to user's RTDB
export const rtdb: Database = getDatabase(app, USER_RTDB_URL);

// Firestore instance
export const db: Firestore = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

// Connection test for user's Realtime Database
export async function testConnection(): Promise<boolean> {
  try {
    const testRef = ref(rtdb, 'dispositivos');
    const snapshot = await get(testRef);
    return snapshot.exists();
  } catch (error) {
    console.warn('RTDB connection error:', error);
    return false;
  }
}

// -------------------------------------------------------------
// MAPPER UTILS FOR USER'S RTDB SCHEMA
// -------------------------------------------------------------
export function mapRTDBDeviceToSensorDevice(key: string, data: any): SensorDevice {
  const coVal = typeof data?.CO === 'number' ? data.CO : 12;
  const pmVal = typeof data?.PM2_5 === 'number' ? data.PM2_5 : 25;
  const tempVal = typeof data?.temperatura === 'number' ? data.temperatura : 22.4;
  const humVal = typeof data?.humedad === 'number' ? data.humedad : 48;
  const serverTime = Number(data?.last_update_server) || 0;

  // Connection check: under 15 seconds difference as requested
  const diffSeconds = serverTime > 0 ? Math.floor(Math.abs(Date.now() - serverTime) / 1000) : 999999;
  const isOnline = diffSeconds <= 15;

  // Determine status based on industrial safety thresholds:
  // If the device is offline (>15s without update), status is 'desconectado'
  // (Prevents disconnected pins / floating 4095 ADC from triggering false alarms)
  let status: 'normal' | 'advertencia' | 'critico' | 'desconectado' = 'normal';
  if (!isOnline) {
    status = 'desconectado';
  } else if (coVal >= 1000 || pmVal >= 500) {
    status = 'critico';
  } else if (coVal >= 300 || pmVal >= 150) {
    status = 'advertencia';
  }

  // Friendly sector and name mapping
  let deviceName = data?.name || key;
  let sectorName = 'Faena Central';
  let assigned = data?.userEmail ? 'Manuel Crisostomo' : 'Cuadrilla Operativa';

  if (key === 'device_38A839E81F84') {
    deviceName = 'Sensor Fase 1 (Chuquicamata - ESP32 Nodo A)';
    sectorName = 'Mina Chuquicamata - Rampa Principal';
    assigned = 'Manuel Crisostomo';
  } else if (key === 'device_A4CB2F124B00') {
    deviceName = 'Detector San José (Gateway ESP32 Nodo B)';
    sectorName = 'Mina San José - Nivel -400m';
    assigned = 'Gerardo Cuellar';
  } else if (key === 'NODO_U-01') {
    deviceName = 'Nodo Fijo Monitoreo U-01';
    sectorName = 'Socavón Norte Frente de Avance';
    assigned = 'Estación Automatizada';
  }

  return {
    id: key,
    code: key,
    name: deviceName,
    type: key.startsWith('NODO') ? 'estacion_fija' : 'multigas_portatil',
    sectorId: `sec-${key}`,
    sectorName: sectorName,
    batteryPct: key === 'device_38A839E81F84' ? 95 : 88,
    signalStrength: isOnline ? 'optima' : 'debil',
    lastPing: serverTime > 0 
      ? (diffSeconds < 60 ? `hace ${diffSeconds} seg` : `hace ${Math.floor(diffSeconds / 60)} min`)
      : 'en vivo (RTDB)',
    status: status,
    assignedTo: assigned,
    rawCO: coVal,
    rawPM25: pmVal,
    rawTemp: tempVal,
    rawHum: humVal,
    lastUpdateServer: serverTime,
    gatewayOnline: isOnline,
    metrics: {
      temperatura: Number(tempVal.toFixed(1)),
      humedad: Number(humVal.toFixed(0)),
      co2: 520,
      co: Number(coVal.toFixed(1)),
      ch4: 0.1,
      o2: 20.9,
      flujoAire: 1.25,
      ruido: 74,
      polvoPM: Number(pmVal.toFixed(0)),
    },
  };
}

export function mapRTDBUserToUserProfile(key: string, data: any): UserProfile {
  const isSuper = data?.isSuperUser === true || data?.email === 'manuelcrisostomovega@gmail.com';
  const isAdmin = isSuper || data?.isAdmin === true || data?.tipoUsuario === 'admin' || data?.cargo === 'Administrador' || data?.tipoUsuario === 'supervisor';

  let role: UserRole = 'operador';
  let roleLabel = 'Usuario Normal / Operador Minero';

  if (isSuper) {
    role = 'superadmin';
    roleLabel = 'Super Administrador de Seguridad Minera';
  } else if (isAdmin) {
    role = 'admin';
    roleLabel = 'Administrador / Prevencionista de Faena';
  }

  const assignedSector = data?.geoMina 
    || (data?.comuna ? `${data.comuna}, ${data.region || 'Chile'}` : 'Faena Minera');

  const assignedDev = data?.deviceId 
    || data?.dispositivo?.nombreDispositivo 
    || (key === 'manual_temp_uid_01' ? 'device_38A839E81F84' : '');

  return {
    id: key,
    name: data?.nombre || key,
    email: data?.email || `${key.toLowerCase().replace(/[^a-z0-9]/g, '')}@minesafe.cl`,
    role: role,
    roleLabel: roleLabel,
    rut: data?.codigoId || data?.telefono || '15.932.104-K',
    shift: data?.cargo || data?.tipoMina || 'Turno Continuo A',
    status: data?.isActive !== false ? 'activo' : 'inactivo',
    lastLogin: 'En línea (RTDB)',
    assignedSector: assignedSector,
    assignedDeviceCode: assignedDev,
  };
}

export function mapRTDBContractToRental(key: string, data: any): DeviceRental {
  const estadoGeneral = data?.estadoGeneral || data?.estadoArriendo || 'Activo';
  let paymentStatus: 'al_dia' | 'proximo_a_vencer' | 'pago_pendiente' | 'vencido' = 'al_dia';

  if (estadoGeneral === 'Por Vencer') {
    paymentStatus = 'proximo_a_vencer';
  } else if (estadoGeneral === 'Finalizado' || estadoGeneral === 'Vencido') {
    paymentStatus = 'vencido';
  } else if (data?.pagos_simulados?.some((p: any) => p.estadoPago === 'Pendiente' || p.estado === 'Pendiente')) {
    paymentStatus = 'pago_pendiente';
  }

  return {
    id: key,
    contractNumber: key,
    deviceCode: data?.deviceId || data?.idDispositivo || 'MS-IOT-REG',
    deviceType: 'Detector MultiGas Certificado DS 132',
    provider: data?.empresa || 'Dräger / MineSafe Mining Equipments',
    startDate: data?.fechaInicioArriendo || data?.fechaInicio || '2025-01-01',
    endDate: data?.fechaFinArriendo || data?.fechaFinContrato || data?.fechaTermino || '2026-12-31',
    monthlyCostClp: typeof data?.monto === 'number' ? data.monto : (typeof data?.monthlyCostClp === 'number' ? data.monthlyCostClp : 185000),
    paymentStatus: paymentStatus,
    lastPaymentDate: '2025-11-15',
    nextDueDate: data?.fechaFinArriendo || '2026-03-31',
    assignedTechnician: data?.tec || 'Ingeniería y Soporte MineSafe',
    notes: `Contrato sincronizado desde Realtime Database (${estadoGeneral}).`,
  };
}

// -------------------------------------------------------------
// REALTIME LISTENERS (RTDB)
// -------------------------------------------------------------
export function subscribeToRTDBDevices(callback: (devices: SensorDevice[]) => void): () => void {
  const devicesRef = ref(rtdb, 'dispositivos');
  const precargaRef = ref(rtdb, 'precarga/usuarios_contratos');

  let liveTelemetryMap: Record<string, any> = {};
  let precargaMap: Record<string, any> = {};

  const emitCombined = () => {
    const combined: SensorDevice[] = [];
    const seenCodes = new Set<string>();

    // 1. First add live telemetry devices (highest priority)
    Object.keys(liveTelemetryMap).forEach((key) => {
      const dev = mapRTDBDeviceToSensorDevice(key, liveTelemetryMap[key]);
      combined.push(dev);
      seenCodes.add(key);
    });

    // 2. Add devices registered in precarga (fleet inventory)
    Object.keys(precargaMap).forEach((userKey) => {
      const u = precargaMap[userKey];
      const disp = u?.dispositivo;
      if (disp && disp.idDispositivo && disp.idDispositivo !== 'N/A' && !seenCodes.has(disp.idDispositivo)) {
        seenCodes.add(disp.idDispositivo);
        combined.push({
          id: disp.idDispositivo,
          code: disp.idDispositivo,
          name: disp.nombreDispositivo || disp.idDispositivo,
          type: 'multigas_portatil',
          sectorId: `sec-${disp.idDispositivo}`,
          sectorName: 'Faena Mina Central',
          batteryPct: 85,
          signalStrength: 'optima',
          lastPing: disp.ultimaConexion || 'En flota',
          status: 'normal',
          assignedTo: u.nombre || 'Operador',
          metrics: {
            temperatura: 22.0,
            humedad: 45,
            co2: 450,
            co: 10.5,
            ch4: 0.1,
            o2: 20.9,
            flujoAire: 1.3,
            ruido: 70,
            polvoPM: 30,
          },
        });
      }
    });

    callback(combined);
  };

  const unsub1 = onValue(devicesRef, (snapshot) => {
    if (snapshot.exists()) {
      liveTelemetryMap = snapshot.val() || {};
      emitCombined();
    }
  });

  const unsub2 = onValue(precargaRef, (snapshot) => {
    if (snapshot.exists()) {
      precargaMap = snapshot.val() || {};
      emitCombined();
    }
  });

  return () => {
    unsub1();
    unsub2();
  };
}

export function subscribeToRTDBUsers(callback: (users: UserProfile[]) => void): () => void {
  const usersRef = ref(rtdb, 'usuarios');
  const precargaRef = ref(rtdb, 'precarga/usuarios_contratos');

  let directUsers: Record<string, any> = {};
  let precargaUsers: Record<string, any> = {};

  const emitCombined = () => {
    const list: UserProfile[] = [];
    const seenEmails = new Set<string>();

    // 1. Process direct usuarios (e.g. Manuel Crisostomo, PEPE LOTA, Gerardo Cuellar, usr001-020)
    Object.keys(directUsers).forEach((key) => {
      const u = mapRTDBUserToUserProfile(key, directUsers[key]);
      if (u.email) seenEmails.add(u.email.toLowerCase());
      list.push(u);
    });

    // 2. Process precarga usuarios
    Object.keys(precargaUsers).forEach((key) => {
      const pu = precargaUsers[key];
      const email = (pu?.email || '').toLowerCase();
      if (!seenEmails.has(email)) {
        if (email) seenEmails.add(email);
        list.push(mapRTDBUserToUserProfile(key, pu));
      }
    });

    // Sort with superadmin first, then admin, then operador
    list.sort((a, b) => {
      if (a.role === 'superadmin') return -1;
      if (b.role === 'superadmin') return 1;
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (b.role === 'admin' && a.role !== 'admin') return 1;
      return a.name.localeCompare(b.name);
    });

    callback(list);
  };

  const unsub1 = onValue(usersRef, (snapshot) => {
    if (snapshot.exists()) {
      directUsers = snapshot.val() || {};
      emitCombined();
    }
  });

  const unsub2 = onValue(precargaRef, (snapshot) => {
    if (snapshot.exists()) {
      precargaUsers = snapshot.val() || {};
      emitCombined();
    }
  });

  return () => {
    unsub1();
    unsub2();
  };
}

export function subscribeToRTDBRentals(callback: (rentals: DeviceRental[]) => void): () => void {
  const contractsRef = ref(rtdb, 'contratos');
  const precargaRef = ref(rtdb, 'precarga/usuarios_contratos');

  let directContracts: Record<string, any> = {};
  let precargaData: Record<string, any> = {};

  const emitCombined = () => {
    const list: DeviceRental[] = [];
    const seenContracts = new Set<string>();

    // 1. Direct contratos (CONTRATO-001 to 004)
    Object.keys(directContracts).forEach((key) => {
      const r = mapRTDBContractToRental(key, directContracts[key]);
      list.push(r);
      seenContracts.add(key);
    });

    // 2. Precarga arriendos (ARR-A001, ARR-U004, etc.)
    Object.keys(precargaData).forEach((userKey) => {
      const u = precargaData[userKey];
      const arr = u?.arriendo;
      if (arr && arr.idArriendo && !seenContracts.has(arr.idArriendo)) {
        seenContracts.add(arr.idArriendo);
        list.push({
          id: arr.idArriendo,
          contractNumber: arr.idArriendo,
          deviceCode: u?.dispositivo?.nombreDispositivo || u?.dispositivo?.idDispositivo || 'DS-FLEET',
          deviceType: 'Detector Portátil MultiGas Certificado DS 132',
          provider: u.empresa || 'MineSafe / Dräger Mining',
          startDate: arr.fechaInicioArriendo || '2025-01-01',
          endDate: arr.fechaTerminoArriendo || '2026-01-01',
          monthlyCostClp: 220000,
          paymentStatus: arr.estadoArriendo === 'Vigente' ? 'al_dia' : (arr.estadoArriendo === 'Vencido' ? 'vencido' : 'proximo_a_vencer'),
          lastPaymentDate: '2025-11-20',
          nextDueDate: arr.fechaTerminoArriendo || '2026-03-31',
          assignedTechnician: u.tec || 'Ingeniería MineSafe',
          notes: `Arriendo de ${u.nombre || 'Trabajador'} (${u.cargo || 'Operador'}).`,
        });
      }
    });

    callback(list);
  };

  const unsub1 = onValue(contractsRef, (snapshot) => {
    if (snapshot.exists()) {
      directContracts = snapshot.val() || {};
      emitCombined();
    }
  });

  const unsub2 = onValue(precargaRef, (snapshot) => {
    if (snapshot.exists()) {
      precargaData = snapshot.val() || {};
      emitCombined();
    }
  });

  return () => {
    unsub1();
    unsub2();
  };
}

// -------------------------------------------------------------
// WRITE OPERATIONS TO RTDB
// -------------------------------------------------------------
export async function updateDeviceInRTDB(
  deviceId: string, 
  data: { 
    CO?: number; 
    PM2_5?: number; 
    temperatura?: number; 
    humedad?: number;
    alarma?: boolean;
    buzzer?: boolean;
    luz?: boolean;
    iluminacion_led?: boolean;
    estado_adquisicion?: string;
  }
): Promise<void> {
  try {
    const devRef = ref(rtdb, `dispositivos/${deviceId}`);
    await update(devRef, {
      ...data,
      last_update_server: Date.now(),
    });
  } catch (err) {
    console.warn('Error updating device in RTDB:', err);
  }
}

export async function addUserToRTDB(user: UserProfile): Promise<void> {
  try {
    const userRef = ref(rtdb, `usuarios/${user.id}`);
    await set(userRef, {
      nombre: user.name,
      email: user.email,
      isAdmin: user.role === 'superadmin' || user.role === 'admin',
      isSuperUser: user.role === 'superadmin',
      tipoUsuario: user.role,
      isActive: user.status === 'activo',
      telefono: user.rut,
      geoMina: user.assignedSector || 'Mina Chuquicamata',
      deviceId: user.assignedDeviceCode || '',
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Error adding user to RTDB:', err);
  }
}

export async function updateUserInRTDB(userId: string, updates: Partial<UserProfile>): Promise<void> {
  try {
    const userRef = ref(rtdb, `usuarios/${userId}`);
    const rtdbUpdates: any = {
      updatedAt: new Date().toISOString(),
    };
    if (updates.name) rtdbUpdates.nombre = updates.name;
    if (updates.email) rtdbUpdates.email = updates.email;
    if (updates.role) {
      rtdbUpdates.tipoUsuario = updates.role;
      rtdbUpdates.isAdmin = updates.role === 'admin' || updates.role === 'superadmin';
      rtdbUpdates.isSuperUser = updates.role === 'superadmin';
    }
    if (updates.status) rtdbUpdates.isActive = updates.status === 'activo';
    if (updates.assignedSector) rtdbUpdates.geoMina = updates.assignedSector;
    if (updates.assignedDeviceCode) rtdbUpdates.deviceId = updates.assignedDeviceCode;

    await update(userRef, rtdbUpdates);
  } catch (err) {
    console.warn('Error updating user in RTDB:', err);
  }
}

export async function addRentalContractToRTDB(rental: DeviceRental): Promise<void> {
  try {
    const contractRef = ref(rtdb, `contratos/${rental.contractNumber}`);
    await set(contractRef, {
      deviceId: rental.deviceCode,
      estadoGeneral: rental.paymentStatus === 'al_dia' ? 'Activo' : 'Por Vencer',
      fechaInicioArriendo: rental.startDate,
      fechaFinArriendo: rental.endDate,
      fechaInicioContrato: rental.startDate,
      fechaFinContrato: rental.endDate,
    });
  } catch (err) {
    console.warn('Error adding contract to RTDB:', err);
  }
}

export async function recordPaymentInRTDB(contractId: string, amount: number): Promise<void> {
  try {
    const pagoId = `PAGO-${Date.now().toString().slice(-4)}`;
    const pagoRef = ref(rtdb, `pagos/${pagoId}`);
    await set(pagoRef, {
      idContrato: contractId,
      monto: amount,
      estado: 'Pagado',
      fechaPago: new Date().toISOString().split('T')[0],
      referencia: `REF-${pagoId}`,
    });
  } catch (err) {
    console.warn('Error recording payment in RTDB:', err);
  }
}

export async function sendESP32Command(deviceId: string, command: 'pause' | 'resume' | 'ping'): Promise<void> {
  try {
    const devRef = ref(rtdb, `dispositivos/${deviceId}`);
    const updates: any = {
      estado_adquisicion: command === 'pause' ? 'pausado' : 'activo',
    };
    if (command === 'ping') {
      updates.last_update_server = Date.now();
    }
    await update(devRef, updates);
  } catch (err) {
    console.warn('Error sending ESP32 command:', err);
  }
}

export async function resetGatewayDataInRTDB(deviceId: string): Promise<void> {
  try {
    const devRef = ref(rtdb, `dispositivos/${deviceId}`);
    await update(devRef, {
      CO: 45, // safe clean air baseline
      PM2_5: 25, // safe low particle baseline
      temperatura: 21.5,
      humedad: 48,
      last_update_server: Date.now(),
      alarma: false,
      buzzer: false,
      luz: false,
      estado_adquisicion: 'activo',
    });
  } catch (err) {
    console.warn('Error resetting gateway in RTDB:', err);
  }
}

export async function toggleGatewayAlarmInRTDB(deviceId: string, active: boolean): Promise<void> {
  try {
    const devRef = ref(rtdb, `dispositivos/${deviceId}`);
    await update(devRef, {
      alarma: active,
      buzzer: active,
      last_update_server: Date.now(),
    });
  } catch (err) {
    console.warn('Error toggling alarm in RTDB:', err);
  }
}

export async function toggleGatewayLightInRTDB(deviceId: string, active: boolean): Promise<void> {
  try {
    const devRef = ref(rtdb, `dispositivos/${deviceId}`);
    await update(devRef, {
      luz: active,
      iluminacion_led: active,
      last_update_server: Date.now(),
    });
  } catch (err) {
    console.warn('Error toggling light in RTDB:', err);
  }
}


