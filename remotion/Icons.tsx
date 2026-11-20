import React from "react";
import {
  Bot, Bug, Camera, ChartColumn, CircleHelp, Clock, Cloud, Code, Cpu, CreditCard, Database, Eye, Fingerprint, Gauge, Globe, Heart,
  House, KeyRound, Landmark, Lock, Mail, MessageCircle, Package, Phone, Plug, QrCode, ScanFace, School, Search, Server, ShieldCheck,
  Smartphone, Star, Settings, BatteryFull, Bell, TriangleAlert, Check, ShoppingCart, Tag, X, User, Users, Wallet, Wifi, Zap, type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  smartphone: Smartphone, key: KeyRound, lock: Lock, shield: ShieldCheck, alert: TriangleAlert, wifi: Wifi, bank: Landmark,
  card: CreditCard, wallet: Wallet, user: User, users: Users, chat: MessageCircle, mail: Mail, phone: Phone, package: Package,
  bug: Bug, server: Server, cloud: Cloud, cpu: Cpu, bot: Bot, globe: Globe, search: Search, eye: Eye, zap: Zap, plug: Plug,
  gauge: Gauge, qrcode: QrCode, camera: Camera, fingerprint: Fingerprint, face: ScanFace, code: Code, database: Database,
  chart: ChartColumn, clock: Clock, home: House, school: School, heart: Heart, star: Star, question: CircleHelp, check: Check, cart: ShoppingCart, tag: Tag, x: X, settings: Settings, battery: BatteryFull, bell: Bell,
};

export const Icon: React.FC<{ name?: string; size: number; color: string; stroke?: number }> = ({ name, size, color, stroke = 2 }) => {
  const C = MAP[name || ""] || CircleHelp;
  return <C size={size} color={color} strokeWidth={stroke} absoluteStrokeWidth={false} />;
};
