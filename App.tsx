import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { colors, radius, spacing, typography } from './src/theme';

type Screen = 'splash' | 'onboarding' | 'home' | 'log' | 'log-detail' | 'profile' | 'profile-edit' | 'profile-photo' | 'feeding-record' | 'diaper-record' | 'medicine-record' | 'sleep-record' | 'knowledge' | 'knowledge-detail' | 'vaccine' | 'vaccine-notice';
type QuickCareId = 'feeding' | 'diaper' | 'sleep' | 'medicine';
type BreastSide = '左侧' | '右侧';
type SleepMode = '计时' | '手动输入';
type TimeField = 'start' | 'end';
type LogType = 'feeding' | 'diaper' | 'sleep' | 'medicine';
type DiaperTab = '臭臭' | '嘘嘘' | '臭臭+嘘嘘';
type FeedingTimeField = 'start' | 'end';
type MedicineOptionField = 'frequency' | 'period' | 'reminder';
type ProfileOptionField = 'feeding' | 'gender' | 'premature';
type BabyAvatarId = 'default' | 'boy' | 'girl';
type KnowledgeDetailSource = 'home' | 'knowledge';
type ToastVariant = 'normal' | 'critical';
type ToastState = { message: string; variant: ToastVariant };
type Notify = (message: string, variant?: ToastVariant) => void;
type RecordReturnScreen = 'home' | 'log';

type QuickCareItem = {
  id: QuickCareId;
  title: string;
  detail: string;
  color: string;
  icon: ImageSourcePropType;
};

type KnowledgeArticle = {
  id: string;
  category: string;
  title: string;
  summary: string;
  meta: string;
  core: string;
  dadTips: string[];
  steps: string[];
  observeTags: string[];
  doctorAdvice: string;
  image: ImageSourcePropType;
  heroImage: ImageSourcePropType;
};

type MedicineEntry = {
  id: number;
  name: string;
  amount: number | null;
  unit: string;
};

type MedicinePlan = {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  period: string;
  takenToday: boolean;
};

type LogEntry = {
  id: string;
  type: LogType;
  time: string;
  minutes: number;
  title: string;
  detail: string;
  detailRows?: Array<[string, string]>;
  icon: ImageSourcePropType;
  color: string;
};

type LogDateItem = {
  week: string;
  day: string;
};

type VaccineItem = {
  id: string;
  age: string;
  title: string;
  planDate: string;
  actualDate?: string;
  completed?: boolean;
};

type CareRecordInput = {
  type: LogType;
  time: Date;
  title: string;
  detail: string;
  detailRows: Array<[string, string]>;
};

type RecordScreenProps = {
  initialEntry?: LogEntry | null;
  onBack: () => void;
  onSaved: (record: CareRecordInput) => void;
  notify: Notify;
};

type BabyProfile = {
  nickname: string;
  birthDate: string;
  feeding: string;
  gender: string;
  birthWeight: string;
  birthHeight: string;
  premature: string;
  gestationalAge: string;
  specialNote: string;
  avatarId?: BabyAvatarId;
};

type ProfilePhotoRecord = {
  id: string;
  uri: string;
  takenAt: string;
  name: string;
};

const quickCareItems: QuickCareItem[] = [
  { id: 'feeding', title: '喂食', detail: '母乳 · 2小时前', color: colors.feeding, icon: require('./assets/icon-feeding.png') },
  { id: 'diaper', title: '臭臭', detail: '小便 · 15分钟前', color: colors.diaper, icon: require('./assets/icon-diaper.png') },
  { id: 'sleep', title: '睡眠', detail: '小睡 · 2小时前', color: colors.sleep, icon: require('./assets/icon-sleep.png') },
  { id: 'medicine', title: '吃药', detail: '维生素D · 2小时前', color: colors.medicine, icon: require('./assets/icon-medicine.png') },
];

const knowledgeArticles: KnowledgeArticle[] = [
  {
    id: 'spit-up-guide',
    category: '护理要点',
    title: '宝宝吐奶正常吗？新手奶爸必读的应对指南',
    summary: '多数轻微吐奶可先观察，重点看精神状态和吃奶情况。',
    meta: '2月龄 · 新手奶爸必看',
    core: '多数轻微吐奶属于常见生理现象，可先观察宝宝精神状态、吃奶量和体重变化。',
    dadTips: ['喂后竖抱拍嗝，帮助排出胃部空气', '配合妈妈少量多次喂养，避免一次吃太急', '喂完后避免立刻平躺或剧烈晃动'],
    steps: ['控制奶速，减少吞入空气。', '每次拍嗝 10-15 分钟左右。', '记录吐奶频率、量和伴随表现。'],
    observeTags: ['精神状态', '吃奶量', '吐奶频率', '体温变化', '体重增长'],
    doctorAdvice: '如果出现喷射样吐奶、精神状态差、持续发热、明显少尿或体重增长异常，请及时咨询医生。',
    image: require('./assets/knowledge-list-spitup.png'),
    heroImage: require('./assets/knowledge-hero-spitup-clean.png'),
  },
  {
    id: 'milk-volume-guide',
    category: '饮食',
    title: '奶量怎么判断够不够？',
    summary: '结合尿量、精神状态和体重变化判断，不只看单次奶量。',
    meta: '2月龄 · 喂养观察',
    core: '判断奶量是否足够，要综合看尿量、体重增长、吃奶后的满足感和精神状态。',
    dadTips: ['记录每次奶量和间隔，帮助家人同步信息', '观察尿布数量和颜色，不只盯着瓶身刻度', '发现连续吃奶少或精神差时及时沟通'],
    steps: ['记录 24 小时总奶量和喂奶次数。', '观察每天尿布数量是否稳定。', '每周固定时间记录体重变化。'],
    observeTags: ['尿量', '体重', '吃奶间隔', '精神状态', '哭闹'],
    doctorAdvice: '如果宝宝明显少尿、持续拒奶、体重增长异常，建议咨询儿科医生或社区保健医生。',
    image: require('./assets/article-milk-volume.png'),
    heroImage: require('./assets/knowledge-hero-milk-clean.png'),
  },
  {
    id: 'burp-guide',
    category: '饮食',
    title: '新生儿拍嗝怎么做更有效？',
    summary: '掌握拍嗝姿势和时机，减少喂奶后的不适。',
    meta: '2月龄 · 喂奶后更安心',
    core: '拍嗝的重点是姿势稳定、节奏轻柔，并根据宝宝反应决定是否继续。',
    dadTips: ['喂奶后主动接手拍嗝，让妈妈能休息一会儿', '托稳头颈和背部，动作保持轻柔', '观察宝宝是否扭动、哭闹或溢奶'],
    steps: ['把宝宝竖抱靠在肩上，胸腹贴稳。', '手掌呈空心状，从下往上轻拍背部。', '若 5-10 分钟未打嗝，可换姿势再尝试。'],
    observeTags: ['打嗝情况', '哭闹程度', '溢奶', '腹胀', '睡前状态'],
    doctorAdvice: '如果宝宝频繁呛咳、呼吸不顺或喂后明显痛苦，应暂停喂养并咨询专业医生。',
    image: require('./assets/knowledge-list-burp.png'),
    heroImage: require('./assets/knowledge-hero-burp-clean.png'),
  },
  {
    id: 'vaccine-guide',
    category: '百科',
    title: '宝宝接种疫苗前后要注意什么？',
    summary: '接种前确认状态，接种后观察体温、精神和局部反应。',
    meta: '2月龄 · 接种提醒',
    core: '疫苗接种前后最重要的是确认宝宝近期状态，并在接种后做好 24-48 小时观察。',
    dadTips: ['提前准备接种证和宝宝近期记录', '接种后一起观察体温和精神状态', '把医生交代的注意事项记到 App 里'],
    steps: ['接种前确认近期是否发热、腹泻或精神差。', '接种当天给宝宝穿方便露出接种部位的衣服。', '接种后观察体温、吃奶和接种部位红肿。'],
    observeTags: ['体温', '精神状态', '接种部位', '吃奶情况', '哭闹'],
    doctorAdvice: '如果宝宝出现高热不退、精神明显变差、严重过敏表现，应及时就医。',
    image: require('./assets/icon-vaccine.png'),
    heroImage: require('./assets/knowledge-hero-vaccine-clean.png'),
  },
  {
    id: 'daily-care-guide',
    category: '护理要点',
    title: '日常清洁护理有哪些细节？',
    summary: '眼鼻口、皮肤和尿布区清洁要轻柔，避免过度刺激。',
    meta: '2月龄 · 日常护理',
    core: '日常清洁护理要保持轻柔、适度和稳定，重点观察皮肤变化和宝宝舒适度。',
    dadTips: ['准备好棉柔巾、温水和干净尿布再开始', '清洁时动作放慢，边做边安抚宝宝', '发现红疹或破皮及时记录并咨询'],
    steps: ['用温水或适合宝宝的清洁用品处理局部。', '清洁后轻轻按干，避免来回摩擦。', '观察皮肤颜色、红疹和宝宝反应。'],
    observeTags: ['皮肤颜色', '红屁屁', '湿疹', '哭闹', '清洁频率'],
    doctorAdvice: '如果皮肤破溃、渗液、红肿明显或宝宝持续不适，应及时咨询医生。',
    image: require('./assets/baby-avatar.png'),
    heroImage: require('./assets/knowledge-hero-care-clean.png'),
  },
  {
    id: 'nap-guide',
    category: '百科',
    title: '宝宝白天小睡要注意什么？',
    summary: '了解月龄睡眠特点，帮助宝宝建立更稳定的节奏。',
    meta: '2月龄 · 日常照护',
    core: '2月龄宝宝白天小睡仍不规律，重点是识别困倦信号并提供稳定睡眠环境。',
    dadTips: ['留意揉眼、打哈欠、发呆等困倦信号', '睡前减少强光和大声逗玩', '和家人统一哄睡节奏，减少反复切换'],
    steps: ['记录每次小睡开始和结束时间。', '小睡前保持房间安静、光线柔和。', '醒后观察精神状态，而不是只看睡眠时长。'],
    observeTags: ['入睡时间', '小睡时长', '夜醒', '哭闹', '醒后状态'],
    doctorAdvice: '如果宝宝持续嗜睡、难以唤醒，或伴随发热、吃奶明显减少，应及时咨询医生。',
    image: require('./assets/knowledge-list-sleep.png'),
    heroImage: require('./assets/knowledge-hero-nap-clean.png'),
  },
];

type NavItemId = 'home' | 'log' | 'profile';

const navItems: Array<{ id: NavItemId; label: string; activeIcon: ImageSourcePropType; inactiveIcon: ImageSourcePropType }> = [
  { id: 'home', label: '首页', activeIcon: require('./assets/nav-home-solid.png'), inactiveIcon: require('./assets/nav-home-linear.png') },
  { id: 'log', label: '日志', activeIcon: require('./assets/nav-log-solid.png'), inactiveIcon: require('./assets/nav-log-linear.png') },
  { id: 'profile', label: '我的', activeIcon: require('./assets/nav-profile-solid.png'), inactiveIcon: require('./assets/nav-profile-linear.png') },
];

const feedingModes = ['母乳', '配方奶', '瓶喂母乳'];
const recordMethods = ['计时', '手动'];
const breastSides: BreastSide[] = ['左侧', '右侧'];
const diaperTabs: DiaperTab[] = ['臭臭', '嘘嘘', '臭臭+嘘嘘'];
const diaperColors = ['黄色', '黄绿色', '墨绿色', '绿褐色', '淡黄色', '暗褐色', '黑色', '白色', '红色'];
const commonDrugs = ['维生素AD', '维生素D3', '益生菌', '钙', '锌', '铁', 'DHA'];
const doseUnits = ['粒', '滴', '袋', '勺', '片', '支', 'ml', 'mg', 'g', 'IU'];
const medicineFrequencyOptions = ['每日1次', '每日2次', '每日3次', '隔日1次', '按需服用'];
const medicinePeriodOptions = ['长期服用', '7天', '14天', '30天', '遵医嘱'];
const medicineReminderOptions = ['已开启', '已关闭'];
const feedingPreferenceOptions = ['母乳', '配方奶', '混合喂养', '暂不确定'];
const genderOptions = ['小男宝', '小女宝'];
const prematureOptions = ['是', '否'];
const logFilterOptions: Array<{ label: string; type: LogType }> = [
  { label: '喂养', type: 'feeding' },
  { label: '睡眠', type: 'sleep' },
  { label: '臭臭', type: 'diaper' },
  { label: '吃药', type: 'medicine' },
];

const vaccineTimeline: VaccineItem[] = [
  { id: 'birth-hepb-1', age: '出生', title: '乙肝疫苗 · 第 1/3 针 · 免费', planDate: '2026.11.16', actualDate: '2026.05.16', completed: true },
  { id: 'month-1-hepb-2', age: '1月龄', title: '乙肝疫苗 · 第 2/3 针 · 免费', planDate: '2026.11.16' },
  { id: 'month-2-polio-1', age: '2月龄', title: '乙肝疫苗 · 第 2/3 针 · 免费', planDate: '2026.11.16' },
  { id: 'month-2-dtap-1', age: '2月龄', title: '乙肝疫苗 · 第 2/3 针 · 免费', planDate: '2026.11.16' },
  { id: 'month-3-dtap-2', age: '3月龄', title: '乙肝疫苗 · 第 2/3 针 · 免费', planDate: '2026.11.16' },
  { id: 'month-3-polio-2', age: '3月龄', title: '乙肝疫苗 · 第 2/3 针 · 免费', planDate: '2026.11.16' },
  { id: 'month-6-hepb-3', age: '6月龄', title: '乙肝疫苗 · 第 3/3 针 · 免费', planDate: '2026.11.16' },
];

const logEntries = ([
  { id: 'sleep-1820', type: 'sleep', time: '18:20', minutes: 18 * 60 + 20, title: '睡眠', detail: '小睡 1小时35分', detailRows: [['开始时间', '16:45'], ['结束时间', '18:20'], ['总时长', '1小时35分'], ['备注', '醒来状态平稳']], icon: require('./assets/icon-sleep.png'), color: '#CDE0FF' },
  { id: 'medicine-1650', type: 'medicine', time: '16:50', minutes: 16 * 60 + 50, title: '吃药', detail: '维生素D3 · 1滴', detailRows: [['药品', '维生素D3'], ['用量', '1滴'], ['服用时间', '16:50'], ['状态', '已记录']], icon: require('./assets/icon-medicine.png'), color: '#CCF000' },
  { id: 'diaper-1630', type: 'diaper', time: '16:30', minutes: 16 * 60 + 30, title: '臭臭', detail: '大便 · 黄色', detailRows: [['类型', '臭臭'], ['颜色', '黄色'], ['红屁屁', '否'], ['备注', '性状正常']], icon: require('./assets/icon-diaper.png'), color: '#FFE2A7' },
  { id: 'feeding-1600', type: 'feeding', time: '16:00', minutes: 16 * 60, title: '喂养', detail: '配方奶 · 150ml', detailRows: [['喂养方式', '配方奶'], ['奶量', '150 ml'], ['开始时间', '16:00'], ['结束时间', '16:18'], ['备注', '喝完后已拍嗝']], icon: require('./assets/icon-feeding.png'), color: '#FFC8F1' },
  { id: 'feeding-1500', type: 'feeding', time: '15:00', minutes: 15 * 60, title: '喂养', detail: '母乳 · 15分钟', detailRows: [['喂养方式', '母乳'], ['时长', '15分钟'], ['最后使用', '左侧'], ['开始时间', '15:00'], ['备注', '吃奶状态好']], icon: require('./assets/icon-feeding.png'), color: '#FFC8F1' },
  { id: 'feeding-1200', type: 'feeding', time: '12:00', minutes: 12 * 60, title: '喂养', detail: '瓶喂母乳 · 120ml', detailRows: [['喂养方式', '瓶喂母乳'], ['奶量', '120 ml'], ['开始时间', '12:00'], ['结束时间', '12:16'], ['备注', '剩余约10ml']], icon: require('./assets/icon-feeding.png'), color: '#FFC8F1' },
] as LogEntry[]).sort((a, b) => b.minutes - a.minutes);

const defaultLogEntry = logEntries.find((entry) => entry.id === 'feeding-1600') ?? logEntries[0]!;
const mockStorageKey = 'naitre.mock.careRecords.v1';
const babyProfileStorageKey = 'naitre.mock.babyProfile.v1';
const medicinePlansStorageKey = 'naitre.mock.medicinePlans.v1';
const knowledgeStorageKey = 'naitre.mock.knowledgeArticles.v1';
const profilePhotosStorageKey = 'naitre.mock.profilePhotos.v1';

const defaultBabyProfile: BabyProfile = {
  nickname: '小玖',
  birthDate: '2026.05.16',
  feeding: '配方奶',
  gender: '小男宝',
  birthWeight: '3.4 kg',
  birthHeight: '50 cm',
  premature: '否',
  gestationalAge: '38周',
  specialNote: '',
  avatarId: 'default',
};

const babyAvatarSources: Record<BabyAvatarId, ImageSourcePropType> = {
  default: require('./assets/baby-avatar.png'),
  boy: require('./assets/onboarding-figma-boy.png'),
  girl: require('./assets/onboarding-figma-girl.png'),
};

function getBabyAvatarSource(profile: BabyProfile) {
  return babyAvatarSources[profile.avatarId ?? 'default'];
}

const logMetaByType: Record<LogType, { icon: ImageSourcePropType; color: string }> = {
  feeding: { icon: require('./assets/icon-feeding.png'), color: '#FFC8F1' },
  diaper: { icon: require('./assets/icon-diaper.png'), color: '#FFE2A7' },
  sleep: { icon: require('./assets/icon-sleep.png'), color: '#CDE0FF' },
  medicine: { icon: require('./assets/icon-medicine.png'), color: '#CCF000' },
};

function reviveLogEntry(entry: LogEntry): LogEntry {
  return {
    ...entry,
    icon: logMetaByType[entry.type].icon,
    color: logMetaByType[entry.type].color,
  };
}

function loadMockCareRecords() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return logEntries;
  try {
    const raw = window.localStorage.getItem(mockStorageKey);
    if (!raw) return logEntries;
    const parsed = JSON.parse(raw) as LogEntry[];
    if (!Array.isArray(parsed) || !parsed.length) return logEntries;
    return parsed.map(reviveLogEntry).sort((a, b) => b.minutes - a.minutes);
  } catch {
    return logEntries;
  }
}

function persistMockCareRecords(records: LogEntry[]) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const payload = records.map(({ icon: _icon, ...entry }) => entry);
  window.localStorage.setItem(mockStorageKey, JSON.stringify(payload));
}

function loadJsonFromStorage<T>(key: string, fallback: T) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function persistJsonToStorage<T>(key: string, value: T) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function loadMockBabyProfile() {
  return loadJsonFromStorage<BabyProfile>(babyProfileStorageKey, defaultBabyProfile);
}

function loadMockMedicinePlans() {
  return loadJsonFromStorage<MedicinePlan[]>(medicinePlansStorageKey, []);
}

function loadMockProfilePhotos() {
  return loadJsonFromStorage<ProfilePhotoRecord[]>(profilePhotosStorageKey, []);
}

function normalizeKnowledgeArticle(article: KnowledgeArticle, index: number): KnowledgeArticle {
  const fallback = knowledgeArticles[index] ?? knowledgeArticles[0]!;
  return {
    ...fallback,
    ...article,
    core: article.core ?? fallback.core,
    dadTips: article.dadTips ?? fallback.dadTips,
    steps: article.steps ?? fallback.steps,
    observeTags: article.observeTags ?? fallback.observeTags,
    doctorAdvice: article.doctorAdvice ?? fallback.doctorAdvice,
    heroImage: article.heroImage ?? fallback.heroImage,
  };
}

function loadMockKnowledgeArticles() {
  return loadJsonFromStorage<KnowledgeArticle[]>(knowledgeStorageKey, knowledgeArticles).map(normalizeKnowledgeArticle);
}

function toMinutes(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function createCareLogEntry(input: CareRecordInput): LogEntry {
  const meta = logMetaByType[input.type];
  const stamp = `${input.type}-${input.time.getTime()}`;
  return {
    id: stamp,
    type: input.type,
    time: formatClock(input.time),
    minutes: toMinutes(input.time),
    title: input.title,
    detail: input.detail,
    detailRows: input.detailRows,
    icon: meta.icon,
    color: meta.color,
  };
}

function formatRelativeMinutes(minutes: number) {
  const now = new Date();
  const currentMinutes = toMinutes(now);
  const diff = Math.max(0, currentMinutes - minutes);
  if (diff < 1) return '刚刚';
  if (diff < 60) return `${diff}分钟前`;
  return `${Math.floor(diff / 60)}小时前`;
}

function getQuickCareSummary(entry: LogEntry) {
  if (entry.type === 'feeding') {
    return getDetailValue(entry, '喂养方式') || entry.detail.split('·')[0]?.trim() || '喂食';
  }
  if (entry.type === 'diaper') {
    return getDetailValue(entry, '类型') || entry.detail.split('·')[0]?.trim() || entry.title;
  }
  if (entry.type === 'sleep') {
    return entry.detail.replace(/\s*\d+.*$/, '').trim() || entry.title;
  }
  if (entry.type === 'medicine') {
    return getDetailValue(entry, '药品') || entry.detail.split('·')[0]?.trim() || entry.title;
  }
  return entry.title;
}

function buildQuickCareItems(records: LogEntry[]) {
  return quickCareItems.map((item) => {
    const typeByQuickId: Record<QuickCareId, LogType> = {
      feeding: 'feeding',
      diaper: 'diaper',
      sleep: 'sleep',
      medicine: 'medicine',
    };
    const latest = records.find((record) => record.type === typeByQuickId[item.id]);
    if (!latest) return item;
    return {
      ...item,
      detail: `${getQuickCareSummary(latest)} · ${formatRelativeMinutes(latest.minutes)}`,
    };
  });
}

function calculateBabyAgeText(birthDateValue: string) {
  const birthDate = parseYmd(birthDateValue);
  const now = new Date();
  let months = (now.getFullYear() - birthDate.getFullYear()) * 12 + now.getMonth() - birthDate.getMonth();
  let days = now.getDate() - birthDate.getDate();
  if (days < 0) {
    months -= 1;
    const previousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += previousMonth.getDate();
  }
  if (months <= 0) return `${Math.max(0, days)}天`;
  return `${months}个月${Math.max(0, days)}天`;
}

function formatProfilePhotoDate(date: Date) {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.round((startOfToday - startOfTarget) / (24 * 60 * 60 * 1000));
  if (dayDiff === 0) return '今天';
  if (dayDiff === 1) return '昨天';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function formatProfilePhotoCaption(photo: ProfilePhotoRecord | null) {
  if (!photo) return '';
  const date = new Date(photo.takenAt);
  return `${formatProfilePhotoDate(date)} ${formatTime(date)}`;
}

function groupProfilePhotos(photos: ProfilePhotoRecord[]) {
  const sorted = [...photos].sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime());
  return sorted.reduce<Array<{ label: string; photos: ProfilePhotoRecord[] }>>((groups, photo) => {
    const label = formatProfilePhotoDate(new Date(photo.takenAt));
    const currentGroup = groups.find((group) => group.label === label);
    if (currentGroup) {
      currentGroup.photos.push(photo);
    } else {
      groups.push({ label, photos: [photo] });
    }
    return groups;
  }, []);
}

function readImageFileAsPhoto(file: File): Promise<ProfilePhotoRecord> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        id: `photo-${file.lastModified}-${file.name}-${Date.now()}`,
        uri: String(reader.result),
        takenAt: new Date(file.lastModified || Date.now()).toISOString(),
        name: file.name || '宝宝照片',
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const logDateItems: LogDateItem[] = [
  { week: '日', day: '15' },
  { week: '今天', day: '16' },
  { week: '二', day: '17' },
  { week: '三', day: '18' },
  { week: '四', day: '19' },
  { week: '五', day: '20' },
  { week: '六', day: '21' },
  { week: '日', day: '22' },
];

const onboardingStars = {
  one: svgImageSource('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29.5352 29.5352"><path d="M13.7806 0.839315C13.9628 -0.279772 15.5724 -0.279772 15.7546 0.839315L17.4508 11.2581C17.5199 11.6826 17.8526 12.0153 18.2771 12.0844L28.6959 13.7806C29.815 13.9628 29.815 15.5724 28.6959 15.7546L18.2771 17.4508C17.8526 17.5199 17.5199 17.8526 17.4508 18.2771L15.7546 28.6959C15.5724 29.815 13.9628 29.815 13.7806 28.6959L12.0844 18.2771C12.0153 17.8526 11.6826 17.5199 11.2581 17.4508L0.839315 15.7546C-0.279772 15.5724 -0.279772 13.9628 0.839315 13.7806L11.2581 12.0844C11.6826 12.0153 12.0153 11.6826 12.0844 11.2581L13.7806 0.839315Z" fill="#FF00E6"/></svg>'),
  two: svgImageSource('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22.6968 22.6968"><path d="M10.3614 0.839315C10.5436 -0.279772 12.1532 -0.279772 12.3354 0.839315L13.5529 8.31759C13.622 8.74206 13.9547 9.07481 14.3792 9.14391L21.8575 10.3614C22.9765 10.5436 22.9765 12.1532 21.8575 12.3354L14.3792 13.5529C13.9547 13.622 13.622 13.9547 13.5529 14.3792L12.3354 21.8575C12.1532 22.9765 10.5436 22.9765 10.3614 21.8575L9.14391 14.3792C9.07481 13.9547 8.74206 13.622 8.31759 13.5529L0.839315 12.3354C-0.279772 12.1532 -0.279772 10.5436 0.839315 10.3614L8.31759 9.14391C8.74206 9.07481 9.07481 8.74206 9.14391 8.31759L10.3614 0.839315Z" fill="#0077FF"/></svg>'),
  three: svgImageSource('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 37.4579 37.4579"><path d="M17.7419 0.839315C17.9241 -0.279772 19.5338 -0.279772 19.7159 0.839315L21.9667 14.6648C22.0358 15.0893 22.3686 15.422 22.7931 15.4911L36.6186 17.7419C37.7376 17.9241 37.7376 19.5338 36.6186 19.7159L22.7931 21.9667C22.3686 22.0358 22.0358 22.3686 21.9667 22.7931L19.7159 36.6186C19.5338 37.7376 17.9241 37.7376 17.7419 36.6186L15.4911 22.7931C15.422 22.3686 15.0893 22.0358 14.6648 21.9667L0.839315 19.7159C-0.279772 19.5338 -0.279772 17.9241 0.839315 17.7419L14.6648 15.4911C15.0893 15.422 15.422 15.0893 15.4911 14.6648L17.7419 0.839315Z" fill="#FFAE00"/></svg>'),
  four: svgImageSource('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 59.729 59.729"><path d="M28.8775 0.839315C29.0597 -0.279772 30.6693 -0.279772 30.8515 0.839315L34.6613 24.2413C34.7304 24.6658 35.0632 24.9985 35.4877 25.0676L58.8897 28.8775C60.0087 29.0597 60.0087 30.6693 58.8897 30.8515L35.4877 34.6613C35.0632 34.7304 34.7304 35.0632 34.6613 35.4877L30.8515 58.8897C30.6693 60.0087 29.0597 60.0087 28.8775 58.8897L25.0676 35.4877C24.9985 35.0632 24.6658 34.7304 24.2413 34.6613L0.839315 30.8515C-0.279772 30.6693 -0.279772 29.0597 0.839315 28.8775L24.2413 25.0676C24.6658 24.9985 24.9985 24.6658 25.0676 24.2413L28.8775 0.839315Z" fill="#B3FF00"/></svg>'),
};

function svgImageSource(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function starBackground(uri: string) {
  return Platform.OS === 'web'
    ? ({
        backgroundImage: `url("${uri}")`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'contain',
      } as any)
    : {};
}

function getLogEntriesForDay(day: string, todayRecords: LogEntry[]) {
  const offset = Number(day) - 16;
  if (offset === 0) return todayRecords;
  return logEntries
    .map((entry, index) => {
      const shiftedMinutes = Math.max(7 * 60, Math.min(22 * 60, entry.minutes + offset * 17 - index * 3));
      const hour = Math.floor(shiftedMinutes / 60);
      const minute = shiftedMinutes % 60;
      return {
        ...entry,
        id: `${entry.id}-${day}`,
        time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        minutes: shiftedMinutes,
        detail: entry.type === 'feeding' && offset > 0 ? entry.detail.replace('150ml', '120ml') : entry.detail,
      };
    })
    .sort((a, b) => b.minutes - a.minutes);
}

function formatClock(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatTime(date: Date) {
  return formatClock(date);
}

function formatYmd(date: Date) {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function parseYmd(value: string) {
  const [year = '2026', month = '06', day = '16'] = value.split('.');
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function getDetailValue(entry: LogEntry | null | undefined, label: string) {
  return entry?.detailRows?.find(([key]) => key === label)?.[1] ?? '';
}

function getRecordScreenForLogType(type: LogType): Screen {
  if (type === 'feeding') return 'feeding-record';
  if (type === 'diaper') return 'diaper-record';
  if (type === 'sleep') return 'sleep-record';
  return 'medicine-record';
}

function dateFromRecordTime(value: string | undefined, fallback = new Date()) {
  const match = value?.match(/(\d{1,2}):(\d{2})/);
  const date = new Date(fallback);
  if (match) {
    date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  }
  return date;
}

function numberFromText(value: string, fallback = 0) {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : fallback;
}

function formatMonthDay(date: Date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addSeconds(date: Date, seconds: number) {
  return new Date(date.getTime() + seconds * 1000);
}

function formatDateTime(date: Date) {
  return `${formatMonthDay(date)} ${formatClock(date)}`;
}

function formatSleepDuration(startTime: Date, endTime: Date) {
  const diffMinutes = Math.max(0, Math.round((endTime.getTime() - startTime.getTime()) / 60000));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  if (hours <= 0) return `${minutes}分钟`;
  if (minutes <= 0) return `${hours}小时`;
  return `${hours}小时${minutes}分钟`;
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(restSeconds).padStart(2, '0')}`;
}

function formatSleepTimer(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const restSeconds = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(restSeconds).padStart(2, '0')}`;
}

function WebStatusBar() {
  if (Platform.OS !== 'web') return null;
  return <Image source={require('./assets/ios-status-bar.png')} style={styles.webStatusBar} resizeMode="stretch" />;
}

function SplashScreen({ onDone }: { onDone: () => void }) {
  const [finished, setFinished] = useState(false);
  const [videoReady, setVideoReady] = useState(Platform.OS === 'web');
  const splashVideoUri = Image.resolveAssetSource(require('./assets/splash-video.mp4')).uri;

  useEffect(() => {
    const timer = setTimeout(() => setFinished(true), 4200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="进入引导页"
      onPress={() => {
        if (finished) onDone();
      }}
      style={styles.splashScreen}
    >
      {Platform.OS === 'web' && !finished && videoReady ? (
        React.createElement('video', {
          src: splashVideoUri,
          autoPlay: true,
          muted: true,
          playsInline: true,
          preload: 'auto',
          poster: Image.resolveAssetSource(require('./assets/splash-final-frame.png')).uri,
          onEnded: () => setFinished(true),
          onError: () => {
            setVideoReady(false);
            setFinished(true);
          },
          style: styles.splashVideo,
        })
      ) : (
        <Image
          source={finished ? require('./assets/splash-final-frame.png') : require('./assets/splash-animation.gif')}
          style={styles.splashImage}
          resizeMode="cover"
        />
      )}
    </Pressable>
  );
}

function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.recordNav}>
      <Pressable accessibilityRole="button" accessibilityLabel="返回首页" onPress={onBack} style={({ pressed }) => [styles.backCircle, pressed && styles.pressed]}>
        <Image source={require('./assets/icon-chevron.png')} style={styles.backIcon} resizeMode="contain" />
      </Pressable>
      <Text style={styles.recordTitle}>{title}</Text>
    </View>
  );
}

function EmptyState({ text, compact }: { text: string; compact?: boolean }) {
  return (
    <View style={[styles.emptyState, compact && styles.emptyStateCompact]}>
      <Image source={require('./assets/empty-state-baby.png')} style={styles.emptyStateImage} resizeMode="contain" />
      <Text style={styles.emptyStateText}>{text}</Text>
    </View>
  );
}

function QuickCareCard({ item, width, onPress }: { item: QuickCareItem; width: number; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`新增${item.title}记录`}
      onPress={onPress}
      style={({ pressed }) => [styles.quickCard, { backgroundColor: item.color, width }, pressed && styles.pressed]}
    >
      <View style={styles.quickIconCircle}>
        <Image source={item.icon} style={styles.quickIconImage} resizeMode="contain" />
      </View>
      <View style={styles.quickCopy}>
        <Text style={styles.quickTitle}>{item.title}</Text>
        <View style={styles.quickMetaRow}>
          <Text numberOfLines={1} style={styles.quickMeta}>{item.detail}</Text>
          <View style={styles.addButton}>
            <Image source={require('./assets/icon-plus.png')} style={styles.addIconImage} resizeMode="contain" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function ArticleRow({ article, onPress }: { article: KnowledgeArticle; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={article.title} onPress={onPress} style={({ pressed }) => [styles.articleRow, pressed && styles.pressed]}>
      <Image source={article.image} style={styles.articleImage} resizeMode="cover" />
      <View style={styles.articleCopy}>
        <Text numberOfLines={1} style={styles.listTitle}>{article.title}</Text>
        <Text numberOfLines={1} style={styles.metaText}>{article.category} · {article.summary} · {article.meta}</Text>
      </View>
      <Image source={require('./assets/icon-chevron.png')} style={styles.chevronImage} resizeMode="contain" />
    </Pressable>
  );
}

function BottomNavigation({ selected, onSelect }: { selected: string; onSelect: (id: string, label: string) => void }) {
  return (
    <View style={styles.bottomNav}>
      {navItems.map((item) => {
        const active = item.id === selected;
        return (
          <Pressable key={item.id} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => onSelect(item.id, item.label)} style={({ pressed }) => [styles.navItem, pressed && styles.navPressed]}>
            <Image
              key={`${item.id}-${active ? 'active' : 'inactive'}`}
              source={active ? item.activeIcon : item.inactiveIcon}
              style={[styles.navIconImage, { tintColor: active ? colors.actionPrimary : colors.textSecondary }]}
              resizeMode="contain"
            />
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function FormRow({
  label,
  required,
  value,
  muted,
  onPress,
  chevron,
}: {
  label: string;
  required?: boolean;
  value: string;
  muted?: boolean;
  onPress?: () => void;
  chevron?: boolean;
}) {
  const content = (
    <>
      <View style={styles.formLabelWrap}>
        <Text style={styles.formLabel}>{label}</Text>
        {required ? <Text style={styles.requiredMark}>*</Text> : null}
      </View>
      <Text numberOfLines={1} style={[styles.formValue, !muted && styles.formValueStrong]}>{value}</Text>
      {chevron ? <Image source={require('./assets/icon-chevron.png')} style={styles.rowChevron} resizeMode="contain" /> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.formRow, pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.formRow}>{content}</View>;
}

function InlineInputRow({
  label,
  required,
  value,
  placeholder,
  onChangeText,
}: {
  label: string;
  required?: boolean;
  value: string;
  placeholder?: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.formRow}>
      <View style={styles.formLabelWrap}>
        <Text style={styles.formLabel}>{label}</Text>
        {required ? <Text style={styles.requiredMark}>*</Text> : null}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        style={[styles.formInlineInput, styles.webNoFocus]}
      />
    </View>
  );
}

function MilkAmountCard({
  milkAmount,
  milkAmountText,
  onMilkAmountTextChange,
  onAdjust,
}: {
  milkAmount: number;
  milkAmountText: string;
  onMilkAmountTextChange: (value: string) => void;
  onAdjust: () => void;
}) {
  return (
    <View style={styles.amountCard}>
      <View style={styles.amountHeader}>
        <View style={styles.formLabelWrap}>
          <Text style={styles.formLabel}>奶量</Text>
          <Text style={styles.requiredMark}>*</Text>
        </View>
        <View style={styles.milkAmountInputWrap}>
          <TextInput
            value={milkAmountText}
            onChangeText={(value) => onMilkAmountTextChange(value.replace(/[^\d]/g, '').slice(0, 4))}
            placeholder="手动输入"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            style={[styles.milkAmountInput, styles.webNoFocus]}
          />
          {milkAmountText ? <Text style={styles.milkAmountUnit}>ml</Text> : null}
        </View>
      </View>
      <Pressable
        accessibilityRole="adjustable"
        accessibilityLabel="奶量选择器"
        accessibilityValue={{ text: `${milkAmount}ml` }}
        onPress={onAdjust}
        style={({ pressed }) => [styles.bottlePicker, pressed && styles.pressed]}
      >
        <Image source={require('./assets/feeding-bottle-picker.png')} style={styles.bottleImage} resizeMode="contain" />
        <View style={styles.milkScale}>
          <Text style={styles.milkScaleSmall}>{milkAmount - 2}ml</Text>
          <Text style={styles.milkScaleMedium}>{milkAmount - 1}ml</Text>
          <Text style={styles.milkScaleSelected}>{milkAmount}ml</Text>
          <Text style={styles.milkScaleMedium}>{milkAmount + 1}ml</Text>
          <Text style={styles.milkScaleSmall}>{milkAmount + 2}ml</Text>
        </View>
      </Pressable>
    </View>
  );
}

function MiniSegment({ options, value, onChange, style }: { options: string[]; value: string; onChange: (value: string) => void; style?: object }) {
  return (
    <View style={[styles.miniSegment, style]}>
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => onChange(option)} style={({ pressed }) => [styles.miniSegmentItem, styles.webNoFocus, active && styles.miniSegmentItemActive, pressed && styles.pressed]}>
            <Text style={[styles.miniSegmentText, active && styles.miniSegmentTextActive]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TimerPanel({ side, time, status, action, active, onPress }: { side: string; time: string; status: string; action: string; active?: boolean; onPress: () => void }) {
  return (
    <View style={[styles.timerPanel, active ? styles.timerPanelActive : styles.timerPanelIdle]}>
      <Text style={styles.timerSide}>{side}</Text>
      <Text style={styles.timerTime}>{time}</Text>
      <Text style={[styles.timerStatus, active ? styles.timerStatusActive : styles.timerStatusIdle]}>{status}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`${action}${side}计时`} onPress={onPress} style={({ pressed }) => [styles.timerButton, active ? styles.timerButtonActive : styles.timerButtonIdle, pressed && styles.pressed]}>
        <Text style={[styles.timerButtonText, active ? styles.timerButtonTextActive : styles.timerButtonTextIdle]}>{action}</Text>
      </Pressable>
    </View>
  );
}

function ManualDurationPanel({ side, minutes, onAdjust }: { side: BreastSide; minutes: number; onAdjust: () => void }) {
  return (
    <Pressable accessibilityRole="adjustable" accessibilityLabel={`${side}手动时长选择`} accessibilityValue={{ text: `${minutes}分钟` }} onPress={onAdjust} style={({ pressed }) => [styles.timerPanel, styles.timerPanelIdle, styles.webNoFocus, pressed && styles.pressed]}>
      <Text style={styles.timerSide}>{side}</Text>
      <View style={styles.manualDurationPicker}>
        <Text style={styles.manualDurationSmall}>{minutes - 2}分</Text>
        <Text style={styles.manualDurationMedium}>{minutes - 1}分</Text>
        <Text style={styles.manualDurationSelected}>{minutes}分</Text>
        <Text style={styles.manualDurationMedium}>{minutes + 1}分</Text>
        <Text style={styles.manualDurationSmall}>{minutes + 2}分</Text>
      </View>
    </Pressable>
  );
}

function BreastTimingCard({
  method,
  lastSide,
  activeSide,
  timers,
  manualDurations,
  onMethodChange,
  onSideChange,
  onToggleTimer,
  onAdjustManualDuration,
}: {
  method: string;
  lastSide: BreastSide;
  activeSide: BreastSide | null;
  timers: Record<BreastSide, number>;
  manualDurations: Record<BreastSide, number>;
  onMethodChange: (value: string) => void;
  onSideChange: (value: BreastSide) => void;
  onToggleTimer: (side: BreastSide) => void;
  onAdjustManualDuration: (side: BreastSide) => void;
}) {
  const leftActive = activeSide === '左侧';
  const rightActive = activeSide === '右侧';
  const leftHasStarted = timers['左侧'] > 0;
  const rightHasStarted = timers['右侧'] > 0;

  return (
    <View style={styles.breastCard}>
      <View style={styles.breastHeader}>
        <View style={styles.formLabelWrap}>
          <Text style={styles.formLabel}>记录方式</Text>
          <Text style={styles.requiredMark}>*</Text>
        </View>
        <MiniSegment options={recordMethods} value={method} onChange={onMethodChange} style={styles.methodSegment} />
      </View>

      {method === '手动' ? (
        <View style={styles.timerGrid}>
          <ManualDurationPanel side="左侧" minutes={manualDurations['左侧']} onAdjust={() => onAdjustManualDuration('左侧')} />
          <ManualDurationPanel side="右侧" minutes={manualDurations['右侧']} onAdjust={() => onAdjustManualDuration('右侧')} />
        </View>
      ) : (
        <View style={styles.timerGrid}>
          <TimerPanel side="左侧" time={formatTimer(timers['左侧'])} status={leftActive ? '正在计时' : leftHasStarted ? '已暂停' : '尚未开始'} action={leftActive ? '暂停' : leftHasStarted ? '继续' : '开始'} active={leftActive} onPress={() => onToggleTimer('左侧')} />
          <TimerPanel side="右侧" time={formatTimer(timers['右侧'])} status={rightActive ? '正在计时' : rightHasStarted ? '已暂停' : '尚未开始'} action={rightActive ? '暂停' : rightHasStarted ? '继续' : '开始'} active={rightActive} onPress={() => onToggleTimer('右侧')} />
        </View>
      )}

      <View style={styles.lastSideRow}>
        <Text style={styles.lastSideLabel}>最后使用</Text>
        <MiniSegment options={breastSides} value={lastSide} onChange={(value) => onSideChange(value as BreastSide)} style={styles.sideSegment} />
      </View>
    </View>
  );
}

function FeedingRecordScreen({ initialEntry, onBack, onSaved, notify }: RecordScreenProps) {
  const initialMode = initialEntry?.type === 'feeding' ? getDetailValue(initialEntry, '喂养方式') || (initialEntry.detail.includes('母乳') ? '母乳' : '配方奶') : '母乳';
  const initialAmount = initialEntry?.type === 'feeding' ? numberFromText(getDetailValue(initialEntry, '奶量'), 62) : 62;
  const initialDuration = initialEntry?.type === 'feeding' ? numberFromText(getDetailValue(initialEntry, '时长'), 20) : 20;
  const [mode, setMode] = useState(initialMode);
  const [milkAmountText, setMilkAmountText] = useState(String(initialAmount));
  const [recordMethod, setRecordMethod] = useState(initialEntry?.type === 'feeding' && initialMode === '母乳' ? '手动' : '计时');
  const [lastSide, setLastSide] = useState<BreastSide>('左侧');
  const [activeSide, setActiveSide] = useState<BreastSide | null>(null);
  const [breastTimers, setBreastTimers] = useState<Record<BreastSide, number>>({ 左侧: 0, 右侧: 0 });
  const [manualDurations, setManualDurations] = useState<Record<BreastSide, number>>({ 左侧: initialDuration, 右侧: 0 });
  const [startTime, setStartTime] = useState(() => dateFromRecordTime(getDetailValue(initialEntry, '开始时间') || initialEntry?.time));
  const [endTime, setEndTime] = useState<Date | null>(() => {
    const endValue = getDetailValue(initialEntry, '结束时间');
    return endValue ? dateFromRecordTime(endValue) : null;
  });
  const [pickerField, setPickerField] = useState<FeedingTimeField | null>(null);
  const [note, setNote] = useState(() => {
    const value = getDetailValue(initialEntry, '备注');
    return value === '无' ? '' : value;
  });
  const [noteOpen, setNoteOpen] = useState(false);
  const milkAmount = Number(milkAmountText) || 0;

  useEffect(() => {
    if (mode !== '母乳' || recordMethod !== '计时' || !activeSide) return undefined;
    const timerId = setInterval(() => {
      setBreastTimers((current) => ({ ...current, [activeSide]: current[activeSide] + 1 }));
    }, 1000);
    return () => clearInterval(timerId);
  }, [activeSide, mode, recordMethod]);

  const saveFeeding = () => {
    if (mode !== '母乳' && milkAmount <= 0) {
      notify('请输入有效奶量');
      return;
    }
    if (mode === '母乳' && recordMethod === '手动' && manualDurations['左侧'] <= 0 && manualDurations['右侧'] <= 0) {
      notify('请填写喂奶时长');
      return;
    }
    if (mode === '母乳' && recordMethod === '计时' && breastTimers['左侧'] <= 0 && breastTimers['右侧'] <= 0) {
      notify('请先开始或填写喂奶时长');
      return;
    }
    if (endTime && endTime.getTime() <= startTime.getTime()) {
      notify('结束时间不能早于开始时间', 'critical');
      return;
    }
    const finishTime = endTime ?? addMinutes(startTime, mode === '母乳' ? Math.max(1, Math.round((breastTimers['左侧'] + breastTimers['右侧']) / 60) || manualDurations['左侧'] + manualDurations['右侧']) : 18);
    const totalMinutes = mode === '母乳'
      ? recordMethod === '计时'
        ? Math.max(1, Math.round((breastTimers['左侧'] + breastTimers['右侧']) / 60))
        : manualDurations['左侧'] + manualDurations['右侧']
      : 0;
    const detail = mode === '母乳' ? `${mode} · ${totalMinutes}分钟` : `${mode} · ${milkAmount}ml`;
    onSaved({
      type: 'feeding',
      time: startTime,
      title: '喂养',
      detail,
      detailRows: [
        ['喂养方式', mode],
        [mode === '母乳' ? '时长' : '奶量', mode === '母乳' ? `${totalMinutes}分钟` : `${milkAmount} ml`],
        ['开始时间', formatTime(startTime)],
        ['结束时间', formatTime(finishTime)],
        ['备注', note || '无'],
      ],
    });
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.recordScrollContent} showsVerticalScrollIndicator={false} bounces>
        <ScreenHeader title="喂食记录" onBack={onBack} />
        <View style={styles.segmentedControl}>
          {feedingModes.map((item) => {
            const active = mode === item;
            return (
              <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => setMode(item)} style={({ pressed }) => [styles.segmentPill, styles.webNoFocus, active && styles.segmentPillActive, pressed && styles.pressed]}>
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.recordForm}>
          <FormRow label="开始时间" required value={formatTime(startTime)} chevron onPress={() => setPickerField('start')} />
          {mode === '母乳' ? (
            <BreastTimingCard
              method={recordMethod}
              lastSide={lastSide}
              activeSide={activeSide}
              timers={breastTimers}
              manualDurations={manualDurations}
              onMethodChange={setRecordMethod}
              onSideChange={setLastSide}
              onToggleTimer={(side) => {
                setLastSide(side);
                setActiveSide((current) => (current === side ? null : side));
              }}
              onAdjustManualDuration={(side) => {
                setLastSide(side);
                setManualDurations((current) => ({ ...current, [side]: current[side] >= 60 ? 1 : current[side] + 1 }));
              }}
            />
          ) : (
            <MilkAmountCard
              milkAmount={milkAmount}
              milkAmountText={milkAmountText}
              onMilkAmountTextChange={setMilkAmountText}
              onAdjust={() => setMilkAmountText(String(milkAmount >= 66 ? 60 : milkAmount + 1))}
            />
          )}
          <FormRow label="结束时间" value={endTime ? formatTime(endTime) : '可选'} muted={!endTime} chevron onPress={() => setPickerField('end')} />
          <FormRow label="备注" value={note || (mode === '母乳' ? '吐奶、拒奶、吃奶慢等' : '吐奶、没喝完、拒奶等')} muted={!note} chevron onPress={() => setNoteOpen(true)} />
        </View>
      </ScrollView>
      <Pressable accessibilityRole="button" accessibilityLabel="保存喂食记录" onPress={saveFeeding} style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}>
        <Text style={styles.saveText}>保存</Text>
      </Pressable>
      {pickerField ? (
        <TimePickerSheet
          title={pickerField === 'start' ? '选择开始时间' : '选择结束时间'}
          value={pickerField === 'start' ? startTime : endTime ?? startTime}
          onCancel={() => setPickerField(null)}
          onConfirm={(date) => {
            if (pickerField === 'start') {
              setStartTime(date);
              if (endTime && endTime.getTime() < date.getTime()) setEndTime(null);
            } else {
              setEndTime(date);
            }
            setPickerField(null);
          }}
        />
      ) : null}
      {noteOpen ? (
        <TextInputSheet
          title="填写备注"
          value={note}
          placeholder={mode === '母乳' ? '吐奶、拒奶、吃奶慢等' : '吐奶、没喝完、拒奶等'}
          onCancel={() => setNoteOpen(false)}
          onConfirm={(value) => {
            setNote(value);
            setNoteOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function DrugChip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.drugChip, styles.webNoFocus, selected && styles.drugChipSelected, pressed && styles.pressed]}>
      <Text style={styles.drugChipText}>{label}</Text>
      {!selected ? <Text style={styles.drugChipPlus}>＋</Text> : null}
    </Pressable>
  );
}

function PillActionButton({ label, onPress, icon, variant = 'primary' }: { label: string; onPress: () => void; icon?: boolean; variant?: 'primary' | 'outline' }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.pillActionButton, variant === 'outline' && styles.pillActionButtonOutline, pressed && styles.pressed]}>
      <Text style={[styles.pillActionText, variant === 'outline' && styles.pillActionTextOutline]}>{label}</Text>
      {icon ? <Image source={require('./assets/icon-plus.png')} tintColor={variant === 'outline' ? '#727272' : colors.actionPrimary} style={styles.pillActionIcon} resizeMode="contain" /> : null}
    </Pressable>
  );
}

function MedicineCard({
  title,
  subtitle,
  right,
  actions,
}: {
  title: string;
  subtitle: string;
  right?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <View style={styles.medicineListCard}>
      <View style={styles.medicineCardCopy}>
        <Text style={styles.medicineCardTitle}>{title}</Text>
        <Text style={styles.medicineCardMeta}>{subtitle}</Text>
      </View>
      {right}
      {actions}
    </View>
  );
}

function DoseSheet({
  doseAmount,
  doseUnit,
  onAmountChange,
  onUnitChange,
  onCancel,
  onConfirm,
}: {
  doseAmount: number;
  doseUnit: string;
  onAmountChange: () => void;
  onUnitChange: (unit: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <View style={styles.modalLayer}>
      <Pressable style={styles.modalScrim} onPress={onCancel} />
      <View style={styles.doseSheet}>
        <Text style={styles.sheetTitle}>填写用量</Text>
        <FormRow label="用量数值" required value={String(doseAmount)} onPress={onAmountChange} />
        <Text style={styles.sheetLabel}>单位</Text>
        <View style={styles.unitGrid}>
          {doseUnits.map((unit) => (
            <Pressable key={unit} accessibilityRole="button" accessibilityState={{ selected: doseUnit === unit }} onPress={() => onUnitChange(unit)} style={({ pressed }) => [styles.unitPill, doseUnit === unit && styles.unitPillActive, pressed && styles.pressed]}>
              <Text style={styles.unitText}>{unit}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.sheetActions}>
          <Pressable accessibilityRole="button" onPress={onCancel} style={({ pressed }) => [styles.sheetCancel, pressed && styles.pressed]}>
            <Text style={styles.sheetCancelText}>取消</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onConfirm} style={({ pressed }) => [styles.sheetConfirm, pressed && styles.pressed]}>
            <Text style={styles.sheetConfirmText}>确定</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function MedicineEditSheet({
  initialPlan,
  onCancel,
  onSave,
  notify,
}: {
  initialPlan?: MedicinePlan;
  onCancel: () => void;
  onSave: (plan: MedicinePlan) => void;
  notify: Notify;
}) {
  const [medicineName, setMedicineName] = useState(initialPlan?.name ?? '维生素D');
  const [singleDose, setSingleDose] = useState(initialPlan?.dose ?? '1滴');
  const [frequency, setFrequency] = useState('每日1次');
  const [takeTime, setTakeTime] = useState(() => {
    const next = new Date();
    next.setHours(18, 20, 0, 0);
    return next;
  });
  const [period, setPeriod] = useState(initialPlan?.period ? `${initialPlan.period}服用` : '长期服用');
  const [instruction, setInstruction] = useState('随奶 / 饭后 / 医嘱');
  const [reminder, setReminder] = useState('已开启');
  const [note, setNote] = useState('其他注意事项');
  const [optionField, setOptionField] = useState<MedicineOptionField | null>(null);
  const [timeOpen, setTimeOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  const optionConfig = optionField
    ? {
      frequency: { title: '选择用药频率', options: medicineFrequencyOptions, value: frequency, setValue: setFrequency },
      period: { title: '选择用药周期', options: medicinePeriodOptions, value: period, setValue: setPeriod },
      reminder: { title: '提醒开关', options: medicineReminderOptions, value: reminder, setValue: setReminder },
    }[optionField]
    : null;

  const saveMedicineEdit = () => {
    if (!medicineName.trim()) {
      notify('请输入药品名称');
      return;
    }
    if (!singleDose.trim()) {
      notify('请填写单次剂量');
      return;
    }
    if (!frequency || !period) {
      notify('请完善用药规则');
      return;
    }
    const normalizedPeriod = period.replace(/服用$/, '');
    onSave({
      id: initialPlan?.id ?? `medicine-${medicineName.trim()}-${Date.now()}`,
      name: medicineName.trim(),
      dose: singleDose.trim(),
      frequency,
      period: normalizedPeriod,
      takenToday: initialPlan?.takenToday ?? false,
    });
  };

  return (
    <>
      <View style={styles.modalLayer}>
        <Pressable style={styles.modalScrim} onPress={onCancel} />
        <View style={styles.medicineEditSheet}>
          <Text style={styles.sheetTitle}>添加药品</Text>
          <InlineInputRow label="药品名称" required value={medicineName} placeholder="请输入药品名称" onChangeText={setMedicineName} />
          <InlineInputRow label="单次剂量" required value={singleDose} placeholder="请输入用量" onChangeText={setSingleDose} />
          <FormRow label="用药频率" required value={frequency} chevron onPress={() => setOptionField('frequency')} />
          <FormRow label="服用时间" value={formatTime(takeTime)} chevron onPress={() => setTimeOpen(true)} />
          <FormRow label="用药周期" required value={period} chevron onPress={() => setOptionField('period')} />
          <InlineInputRow label="用药说明" value={instruction} placeholder="随奶 / 饭后 / 医嘱" onChangeText={setInstruction} />
          <FormRow label="提醒开关" value={reminder} chevron onPress={() => setOptionField('reminder')} />
          <FormRow label="备注" value={note || '其他注意事项'} muted={!note} chevron onPress={() => setNoteOpen(true)} />
          <Pressable accessibilityRole="button" onPress={saveMedicineEdit} style={({ pressed }) => [styles.sheetFullButton, pressed && styles.pressed]}>
            <Text style={styles.sheetConfirmText}>保存药品</Text>
          </Pressable>
        </View>
      </View>
      {optionConfig ? (
        <OptionPickerSheet
          title={optionConfig.title}
          options={optionConfig.options}
          value={optionConfig.value}
          onCancel={() => setOptionField(null)}
          onConfirm={(value) => {
            optionConfig.setValue(value);
            setOptionField(null);
          }}
        />
      ) : null}
      {timeOpen ? (
        <TimePickerSheet
          title="选择服用时间"
          value={takeTime}
          onCancel={() => setTimeOpen(false)}
          onConfirm={(value) => {
            setTakeTime(value);
            setTimeOpen(false);
          }}
        />
      ) : null}
      {noteOpen ? (
        <TextInputSheet
          title="填写备注"
          value={note}
          placeholder="其他注意事项"
          onCancel={() => setNoteOpen(false)}
          onConfirm={(value) => {
            setNote(value);
            setNoteOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function DiaperChoiceGrid({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <View style={styles.diaperChoiceGrid}>
      {options.map((item) => {
        const selected = item === value;
        return (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(item)}
            style={({ pressed }) => [styles.diaperChoice, selected && styles.diaperChoiceSelected, pressed && styles.pressed]}
          >
            <Text style={[styles.diaperChoiceText, selected && styles.diaperChoiceTextSelected]}>{item}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function DiaperPhotoCard({ photoCount, onAdd, onRemove }: { photoCount: number; onAdd: () => void; onRemove: () => void }) {
  if (photoCount <= 0) {
    return (
      <View style={styles.diaperPhotoRow}>
        <Text style={styles.diaperPhotoLabel}>照片</Text>
        <Text numberOfLines={1} style={styles.diaperPhotoHint}>异常时建议上传</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="添加尿布照片" onPress={onAdd} style={({ pressed }) => [styles.diaperAddPhotoButton, styles.diaperAddPhotoButtonCompact, pressed && styles.pressed]}>
          <Text style={styles.diaperAddPhotoText}>添加＋</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.diaperPhotoCard}>
      <View style={styles.diaperPhotoHeader}>
        <Text style={styles.diaperPhotoTitle}>照片</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="继续添加尿布照片" onPress={onAdd} style={({ pressed }) => [styles.diaperAddPhotoButton, pressed && styles.pressed]}>
          <Text style={styles.diaperAddPhotoText}>添加{photoCount}/3＋</Text>
        </Pressable>
      </View>
      <View style={styles.diaperThumbRow}>
        {Array.from({ length: photoCount }).map((_, index) => (
          <View key={index} style={styles.diaperThumbWrap}>
            <Image source={require('./assets/diaper-photo-thumb.png')} style={styles.diaperThumb} resizeMode="cover" />
            <Pressable accessibilityRole="button" accessibilityLabel="删除尿布照片" onPress={onRemove} style={({ pressed }) => [styles.diaperThumbClose, pressed && styles.pressed]}>
              <Text style={styles.diaperThumbCloseText}>×</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

function DiaperRecordScreen({ initialEntry, onBack, onSaved, notify }: RecordScreenProps) {
  const initialType = getDetailValue(initialEntry, '类型') as DiaperTab;
  const [activeTab, setActiveTab] = useState<DiaperTab>(initialEntry?.type === 'diaper' && initialType ? initialType : '臭臭');
  const [poopColor, setPoopColor] = useState(initialEntry?.type === 'diaper' ? getDetailValue(initialEntry, '颜色') || '黄色' : '黄色');
  const [redButt, setRedButt] = useState(initialEntry?.type === 'diaper' ? getDetailValue(initialEntry, '红屁屁') || '是' : '是');
  const [photoCount, setPhotoCount] = useState(initialEntry?.type === 'diaper' ? numberFromText(getDetailValue(initialEntry, '照片'), 0) : 0);
  const [changeTime, setChangeTime] = useState(() => dateFromRecordTime(getDetailValue(initialEntry, '更换时间') || initialEntry?.time));
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [note, setNote] = useState(() => {
    const value = getDetailValue(initialEntry, '备注');
    return value === '无' ? '' : value;
  });
  const [noteOpen, setNoteOpen] = useState(false);
  const showPoopFields = activeTab !== '嘘嘘';

  const saveDiaper = () => {
    if (showPoopFields && !poopColor) {
      notify('请选择臭臭颜色');
      return;
    }
    if (!changeTime) {
      notify('请选择更换时间');
      return;
    }
    const detail = showPoopFields ? `${activeTab} · ${poopColor}` : '嘘嘘 · 已更换';
    onSaved({
      type: 'diaper',
      time: changeTime,
      title: activeTab === '嘘嘘' ? '尿尿' : '臭臭',
      detail,
      detailRows: [
        ['类型', activeTab],
        ['更换时间', formatTime(changeTime)],
        ['颜色', showPoopFields ? poopColor : '无'],
        ['红屁屁', redButt],
        ['照片', `${photoCount}张`],
        ['备注', note || '无'],
      ],
    });
  };

  return (
    <View style={styles.diaperPage}>
      <ScrollView contentContainerStyle={styles.diaperScrollContent} showsVerticalScrollIndicator={false} bounces>
        <ScreenHeader title="尿布记录" onBack={onBack} />

        <View style={styles.segmentedControl}>
          {diaperTabs.map((tab) => {
            const active = activeTab === tab;
            return (
              <Pressable
                key={tab}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setActiveTab(tab)}
                style={({ pressed }) => [styles.segmentPill, styles.webNoFocus, active && styles.segmentPillActive, pressed && styles.pressed]}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{tab}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.diaperContent}>
          <FormRow label="更换时间" required value={formatTime(changeTime)} chevron onPress={() => setTimePickerOpen(true)} />

          {showPoopFields ? (
            <View style={styles.diaperSection}>
              <Text style={styles.diaperSectionTitle}>臭臭颜色</Text>
              <DiaperChoiceGrid value={poopColor} options={diaperColors} onChange={setPoopColor} />
            </View>
          ) : null}

          <View style={styles.diaperRows}>
            <View style={styles.diaperToggleRow}>
              <Text style={styles.diaperRowLabel}>红屁屁</Text>
              <View style={styles.diaperToggleGroup}>
                {['是', '否'].map((item) => {
                  const selected = redButt === item;
                  return (
                    <Pressable
                      key={item}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setRedButt(item)}
                      style={({ pressed }) => [styles.diaperToggleOption, selected && styles.diaperToggleOptionSelected, pressed && styles.pressed]}
                    >
                      <Text style={[styles.diaperToggleText, selected && styles.diaperToggleTextSelected]}>{item}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <DiaperPhotoCard
              photoCount={photoCount}
              onAdd={() => setPhotoCount((current) => (current >= 3 ? 3 : current + 1))}
              onRemove={() => setPhotoCount((current) => Math.max(0, current - 1))}
            />

            <FormRow label="备注" value={note || '其他说明'} muted={!note} chevron onPress={() => setNoteOpen(true)} />
          </View>
        </View>
      </ScrollView>

      <Pressable accessibilityRole="button" accessibilityLabel="保存尿布记录" onPress={saveDiaper} style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}>
        <Text style={styles.saveText}>保存</Text>
      </Pressable>
      {timePickerOpen ? (
        <TimePickerSheet
          title="选择更换时间"
          value={changeTime}
          onCancel={() => setTimePickerOpen(false)}
          onConfirm={(date) => {
            setChangeTime(date);
            setTimePickerOpen(false);
          }}
        />
      ) : null}
      {noteOpen ? (
        <TextInputSheet
          title="填写备注"
          value={note}
          placeholder="其他说明"
          onCancel={() => setNoteOpen(false)}
          onConfirm={(value) => {
            setNote(value);
            setNoteOpen(false);
          }}
        />
      ) : null}
    </View>
  );
}

function TimePickerSheet({
  title,
  value,
  onCancel,
  onConfirm,
}: {
  title: string;
  value: Date;
  onCancel: () => void;
  onConfirm: (date: Date) => void;
}) {
  const [draft, setDraft] = useState(value);
  const dayOptions = [-1, 0, 1].map((offset) => addMinutes(draft, offset * 24 * 60));
  const hours = [-1, 0, 1].map((offset) => (draft.getHours() + offset + 24) % 24);
  const minutes = [-1, 0, 1].map((offset) => (draft.getMinutes() + offset + 60) % 60);

  const setDraftDay = (day: Date) => {
    const next = new Date(draft);
    next.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
    setDraft(next);
  };

  const setDraftHour = (hour: number) => {
    const next = new Date(draft);
    next.setHours(hour);
    setDraft(next);
  };

  const setDraftMinute = (minute: number) => {
    const next = new Date(draft);
    next.setMinutes(minute);
    setDraft(next);
  };

  const renderPickerColumn = <T,>({
    label,
    items,
    getKey,
    getLabel,
    isSelected,
    onSelect,
  }: {
    label: string;
    items: T[];
    getKey: (item: T) => string;
    getLabel: (item: T) => string;
    isSelected: (item: T) => boolean;
    onSelect: (item: T) => void;
  }) => (
    <View style={styles.timePickerColumn}>
      <Text style={styles.timePickerColumnLabel}>{label}</Text>
      {items.map((item) => {
        const selected = isSelected(item);
        return (
          <Pressable key={getKey(item)} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => onSelect(item)} style={({ pressed }) => [styles.timePickerOption, selected && styles.timePickerOptionActive, pressed && styles.pressed]}>
            <Text style={[styles.timePickerOptionText, selected && styles.timePickerOptionTextActive]}>{getLabel(item)}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={styles.modalLayer}>
      <Pressable style={styles.modalScrim} onPress={onCancel} />
      <View style={styles.timePickerSheet}>
        <View style={styles.timePickerHeader}>
          <Text style={styles.sheetTitle}>{title}</Text>
        </View>
        <View style={styles.timePickerColumns}>
          {renderPickerColumn({
            label: '日期',
            items: dayOptions,
            getKey: (day) => `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`,
            getLabel: (day) => formatMonthDay(day),
            isSelected: (day) => day.getFullYear() === draft.getFullYear() && day.getMonth() === draft.getMonth() && day.getDate() === draft.getDate(),
            onSelect: setDraftDay,
          })}
          {renderPickerColumn({
            label: '时',
            items: hours,
            getKey: (hour) => `hour-${hour}`,
            getLabel: (hour) => String(hour).padStart(2, '0'),
            isSelected: (hour) => hour === draft.getHours(),
            onSelect: setDraftHour,
          })}
          {renderPickerColumn({
            label: '分',
            items: minutes,
            getKey: (minute) => `minute-${minute}`,
            getLabel: (minute) => String(minute).padStart(2, '0'),
            isSelected: (minute) => minute === draft.getMinutes(),
            onSelect: setDraftMinute,
          })}
        </View>
        <View style={styles.sheetActions}>
          <Pressable accessibilityRole="button" onPress={onCancel} style={({ pressed }) => [styles.sheetCancel, pressed && styles.pressed]}>
            <Text style={styles.sheetCancelText}>取消</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => onConfirm(draft)} style={({ pressed }) => [styles.sheetConfirm, pressed && styles.pressed]}>
            <Text style={styles.sheetConfirmText}>确定</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function TextInputSheet({
  title,
  value,
  placeholder,
  onCancel,
  onConfirm,
}: {
  title: string;
  value: string;
  placeholder?: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  return (
    <View style={styles.modalLayer}>
      <Pressable style={styles.modalScrim} onPress={onCancel} />
      <View style={styles.textInputSheet}>
        <Text style={styles.sheetTitle}>{title}</Text>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          multiline
          style={styles.sheetTextInput}
        />
        <View style={styles.sheetActions}>
          <Pressable accessibilityRole="button" onPress={onCancel} style={({ pressed }) => [styles.sheetCancel, pressed && styles.pressed]}>
            <Text style={styles.sheetCancelText}>取消</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => onConfirm(draft)} style={({ pressed }) => [styles.sheetConfirm, pressed && styles.pressed]}>
            <Text style={styles.sheetConfirmText}>确定</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function OptionPickerSheet({
  title,
  options,
  value,
  onCancel,
  onConfirm,
}: {
  title: string;
  options: string[];
  value: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  return (
    <View style={styles.modalLayer}>
      <Pressable style={styles.modalScrim} onPress={onCancel} />
      <View style={styles.optionSheet}>
        <Text style={styles.sheetTitle}>{title}</Text>
        <View style={styles.optionSheetList}>
          {options.map((option) => {
            const selected = option === draft;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setDraft(option)}
                style={({ pressed }) => [styles.optionSheetItem, selected && styles.optionSheetItemActive, pressed && styles.pressed]}
              >
                <Text style={[styles.optionSheetText, selected && styles.optionSheetTextActive]}>{option}</Text>
                {selected ? <Text style={styles.optionSheetCheck}>✓</Text> : null}
              </Pressable>
            );
          })}
        </View>
        <View style={styles.sheetActions}>
          <Pressable accessibilityRole="button" onPress={onCancel} style={({ pressed }) => [styles.sheetCancel, pressed && styles.pressed]}>
            <Text style={styles.sheetCancelText}>取消</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => onConfirm(draft)} style={({ pressed }) => [styles.sheetConfirm, pressed && styles.pressed]}>
            <Text style={styles.sheetConfirmText}>确定</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function DateOnlyPickerSheet({
  title,
  value,
  onCancel,
  onConfirm,
}: {
  title: string;
  value: Date;
  onCancel: () => void;
  onConfirm: (value: Date) => void;
}) {
  const [draft, setDraft] = useState(value);
  const years = [-1, 0, 1].map((offset) => draft.getFullYear() + offset);
  const months = [-1, 0, 1].map((offset) => (draft.getMonth() + offset + 12) % 12);
  const days = [-1, 0, 1].map((offset) => {
    const next = new Date(draft);
    next.setDate(draft.getDate() + offset);
    return next.getDate();
  });

  const setYear = (year: number) => {
    const next = new Date(draft);
    next.setFullYear(year);
    setDraft(next);
  };

  const setMonth = (month: number) => {
    const next = new Date(draft);
    next.setMonth(month);
    setDraft(next);
  };

  const setDay = (day: number) => {
    const next = new Date(draft);
    next.setDate(day);
    setDraft(next);
  };

  const renderColumn = ({
    label,
    values,
    selected,
    getLabel,
    onSelect,
  }: {
    label: string;
    values: number[];
    selected: number;
    getLabel: (value: number) => string;
    onSelect: (value: number) => void;
  }) => (
    <View style={styles.vaccineDateColumn}>
      <Text style={styles.vaccineDateLabel}>{label}</Text>
      {values.map((item) => {
        const active = item === selected;
        return active ? (
          <Pressable key={`${label}-${item}`} accessibilityRole="button" accessibilityState={{ selected: true }} onPress={() => onSelect(item)} style={({ pressed }) => [styles.vaccineDateSelected, pressed && styles.pressed]}>
            <Text style={styles.vaccineDateSelectedText}>{getLabel(item)}</Text>
          </Pressable>
        ) : (
          <Pressable key={`${label}-${item}`} accessibilityRole="button" onPress={() => onSelect(item)} style={({ pressed }) => [pressed && styles.pressed]}>
            <Text style={styles.vaccineDateSide}>{getLabel(item)}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={styles.vaccineModalLayer}>
      <Pressable accessibilityRole="button" accessibilityLabel="关闭日期选择" onPress={onCancel} style={styles.vaccineModalOverlay} />
      <View style={styles.vaccineDateSheet}>
        <Text style={styles.vaccineSheetTitle}>{title}</Text>
        <View style={styles.vaccineDatePicker}>
          {renderColumn({ label: '年', values: years, selected: draft.getFullYear(), getLabel: (year) => String(year), onSelect: setYear })}
          {renderColumn({ label: '月', values: months, selected: draft.getMonth(), getLabel: (month) => String(month + 1).padStart(2, '0'), onSelect: setMonth })}
          {renderColumn({ label: '日', values: days, selected: draft.getDate(), getLabel: (day) => String(day).padStart(2, '0'), onSelect: setDay })}
        </View>
        <View style={styles.vaccineSheetActions}>
          <Pressable accessibilityRole="button" onPress={onCancel} style={({ pressed }) => [styles.vaccineCancelButton, pressed && styles.pressed]}>
            <Text style={styles.vaccineCancelText}>取消</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => onConfirm(draft)} style={({ pressed }) => [styles.vaccineConfirmButton, pressed && styles.pressed]}>
            <Text style={styles.vaccineConfirmText}>确定</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function SleepRecordScreen({ initialEntry, onBack, onSaved, notify }: RecordScreenProps) {
  const [sleepMode, setSleepMode] = useState<SleepMode>(initialEntry?.type === 'sleep' ? '手动输入' : '计时');
  const [sleeping, setSleeping] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState(() => dateFromRecordTime(getDetailValue(initialEntry, '开始时间'), new Date()));
  const [endTime, setEndTime] = useState(() => {
    const fallback = addMinutes(new Date(), 90);
    return dateFromRecordTime(getDetailValue(initialEntry, '结束时间') || initialEntry?.time, fallback);
  });
  const [pickerField, setPickerField] = useState<TimeField | null>(null);
  const [note, setNote] = useState(() => {
    const value = getDetailValue(initialEntry, '备注');
    return value === '无' ? '' : value;
  });
  const [noteOpen, setNoteOpen] = useState(false);

  useEffect(() => {
    if (!sleeping) return undefined;
    const timer = setInterval(() => setElapsedSeconds((current) => current + 1), 1000);
    return () => clearInterval(timer);
  }, [sleeping]);

  const switchMode = (mode: SleepMode) => {
    setSleepMode(mode);
    if (mode === '手动输入') {
      const now = new Date();
      setStartTime(now);
      setEndTime(now);
      setSleeping(false);
      setTimerStarted(false);
    }
  };

  const startTimer = () => {
    if (timerStarted) {
      setSleeping(true);
      notify('睡眠计时已继续');
      return;
    }
    const now = new Date();
    setStartTime(now);
    setEndTime(now);
    setElapsedSeconds(0);
    setTimerStarted(true);
    setSleeping(true);
  };

  const pauseTimer = () => {
    setEndTime(addSeconds(startTime, elapsedSeconds));
    setSleeping(false);
    notify('睡眠计时已暂停');
  };

  const confirmPicker = (date: Date) => {
    if (pickerField === 'start') {
      setStartTime(date);
      if (sleepMode === '手动输入') {
        setEndTime(date);
      } else if (endTime.getTime() <= date.getTime()) {
        setEndTime(addMinutes(date, 90));
      }
    }
    if (pickerField === 'end') {
      if (date.getTime() <= startTime.getTime()) {
        setEndTime(addMinutes(startTime, 30));
        notify('结束时间已自动调整到开始时间之后');
      } else {
        setEndTime(date);
      }
    }
    setPickerField(null);
  };

  const saveSleep = () => {
    if (sleepMode === '计时' && !timerStarted) {
      notify('请先开始睡眠计时');
      return;
    }
    const finalEndTime = sleepMode === '计时' ? addSeconds(startTime, Math.max(1, elapsedSeconds)) : endTime;
    if (finalEndTime.getTime() <= startTime.getTime()) {
      notify('结束时间不能早于开始时间', 'critical');
      return;
    }
    const duration = formatSleepDuration(startTime, finalEndTime);
    onSaved({
      type: 'sleep',
      time: finalEndTime,
      title: '睡眠',
      detail: `小睡 ${duration}`,
      detailRows: [
        ['开始时间', formatDateTime(startTime)],
        ['结束时间', formatDateTime(finalEndTime)],
        ['总时长', duration],
        ['记录方式', sleepMode],
        ['备注', note || '无'],
      ],
    });
  };

  const pickerValue = pickerField === 'end' ? endTime : startTime;
  const currentEndTime = sleepMode === '计时' ? addSeconds(startTime, Math.max(1, elapsedSeconds)) : endTime;
  const currentDuration = sleepMode === '计时' ? formatSleepDuration(startTime, currentEndTime) : formatSleepDuration(startTime, endTime);
  const showTimerDetails = timerStarted;
  const timerActionLabel = sleeping ? '暂停一下' : timerStarted ? '继续计时' : '开始睡觉了';

  return (
    <>
      <ScrollView contentContainerStyle={styles.recordScrollContent} showsVerticalScrollIndicator={false} bounces>
        <ScreenHeader title="睡眠记录" onBack={onBack} />

        <View style={[styles.segmentedControl, styles.sleepSegmentedControl]}>
          {(['计时', '手动输入'] as SleepMode[]).map((mode) => (
            <Pressable key={mode} accessibilityRole="button" accessibilityState={{ selected: sleepMode === mode }} onPress={() => switchMode(mode)} style={({ pressed }) => [styles.segmentPill, sleepMode === mode && styles.segmentPillActive, pressed && styles.pressed]}>
              <Text style={[styles.segmentText, sleepMode === mode && styles.segmentTextActive]}>{mode}</Text>
            </Pressable>
          ))}
        </View>

        {sleepMode === '计时' ? (
          <>
            <View style={[styles.sleepCenterStage, showTimerDetails && styles.sleepCenterStageWithDetails]}>
              <Pressable accessibilityRole="button" accessibilityLabel={sleeping ? '暂停睡眠计时' : timerStarted ? '继续睡眠计时' : '开始睡眠计时'} onPress={sleeping ? pauseTimer : startTimer} style={({ pressed }) => [styles.sleepCircleButton, sleeping && styles.sleepCircleButtonActive, pressed && styles.pressed]}>
                <SleepTimerIcon active={sleeping} />
                <Text style={[styles.sleepCircleText, sleeping && styles.sleepCircleTextActive]}>{timerActionLabel}</Text>
              </Pressable>
              {showTimerDetails ? (
                <View style={styles.sleepElapsedBlock}>
                  <Text style={styles.sleepElapsedLabel}>宝宝已睡</Text>
                  <Text style={styles.sleepElapsedTime}>{formatSleepTimer(elapsedSeconds)}</Text>
                </View>
              ) : null}
            </View>
            {showTimerDetails ? (
              <View style={styles.sleepRecordRows}>
                <FormRow label="开始时间" value={formatDateTime(startTime)} chevron onPress={() => setPickerField('start')} />
                {sleeping ? <FormRow label="总时长" value={currentDuration} /> : <FormRow label="结束时间" value={formatDateTime(currentEndTime)} />}
                {!sleeping ? <FormRow label="备注" value={note || '夜醒、哄睡难、惊跳等'} muted={!note} chevron onPress={() => setNoteOpen(true)} /> : null}
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.sleepManualRows}>
            <FormRow label="开始时间" value={formatDateTime(startTime)} chevron onPress={() => setPickerField('start')} />
            <FormRow label="结束时间" value={endTime.getTime() <= startTime.getTime() ? '请输入' : formatDateTime(endTime)} chevron onPress={() => setPickerField('end')} />
            <FormRow label="总时长" value={endTime.getTime() <= startTime.getTime() ? '根据输入自动填写' : formatSleepDuration(startTime, endTime)} />
            <FormRow label="备注" value={note || '夜醒、哄睡难、惊跳等'} muted={!note} chevron onPress={() => setNoteOpen(true)} />
          </View>
        )}
      </ScrollView>

      <Pressable accessibilityRole="button" accessibilityLabel="保存睡眠记录" onPress={saveSleep} style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}>
        <Text style={styles.saveText}>保存</Text>
      </Pressable>

      {pickerField ? <TimePickerSheet title={pickerField === 'start' ? '选择开始时间' : '选择结束时间'} value={pickerValue} onCancel={() => setPickerField(null)} onConfirm={confirmPicker} /> : null}
      {noteOpen ? (
        <TextInputSheet
          title="填写备注"
          value={note}
          placeholder="夜醒、哄睡难、惊跳等"
          onCancel={() => setNoteOpen(false)}
          onConfirm={(value) => {
            setNote(value);
            setNoteOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function MedicineRecordScreen({
  medicinePlans,
  onMedicinePlansChange,
  initialEntry,
  onBack,
  onSaved,
  notify,
}: {
  medicinePlans: MedicinePlan[];
  onMedicinePlansChange: (plans: MedicinePlan[]) => void;
} & RecordScreenProps) {
  const initialMedicineEntries = (() => {
    if (initialEntry?.type !== 'medicine') return [{ id: 1, name: '', amount: null, unit: '' }];
    const names = getDetailValue(initialEntry, '药品').split('、').filter(Boolean);
    const doses = getDetailValue(initialEntry, '用量').split('、').filter(Boolean);
    return names.length ? names.map((name, index) => {
      const dose = doses[index] ?? '1滴';
      const amount = numberFromText(dose, 1);
      const unit = dose.replace(String(amount), '') || '滴';
      return { id: index + 1, name, amount, unit };
    }) : [{ id: 1, name: '', amount: null, unit: '' }];
  })();
  const [medicineEntries, setMedicineEntries] = useState<MedicineEntry[]>(initialMedicineEntries);
  const [activeEntryId, setActiveEntryId] = useState(1);
  const [nextEntryId, setNextEntryId] = useState(initialMedicineEntries.length + 1);
  const [takenTime, setTakenTime] = useState(() => dateFromRecordTime(getDetailValue(initialEntry, '服用时间') || initialEntry?.time));
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [doseAmount, setDoseAmount] = useState(1);
  const [doseUnit, setDoseUnit] = useState('滴');
  const [taken, setTaken] = useState(false);
  const [doseSheetOpen, setDoseSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MedicinePlan | null>(null);

  const appendMedicineEntry = (name = '') => {
    const id = nextEntryId;
    setMedicineEntries((current) => [...current, { id, name, amount: name ? 1 : null, unit: name ? '滴' : '' }]);
    setActiveEntryId(id);
    setNextEntryId((current) => current + 1);
  };

  const removeMedicineEntry = (id: number) => {
    setMedicineEntries((current) => {
      const next = current.filter((entry) => entry.id !== id);
      if (activeEntryId === id) {
        setActiveEntryId(next[0]?.id ?? nextEntryId);
      }
      return next.length ? next : [{ id: nextEntryId, name: '', amount: null, unit: '' }];
    });
  };

  const openDoseSheet = (entry: MedicineEntry) => {
    setActiveEntryId(entry.id);
    setDoseAmount(entry.amount ?? 1);
    setDoseUnit(entry.unit || '滴');
    setDoseSheetOpen(true);
  };

  const confirmDoseSheet = () => {
    setMedicineEntries((current) => current.map((entry) => (entry.id === activeEntryId ? { ...entry, amount: doseAmount, unit: doseUnit } : entry)));
    setDoseSheetOpen(false);
  };

  const saveMedicineRecord = () => {
    const nonEmptyEntries = medicineEntries.filter((entry) => entry.name.trim() || entry.amount);
    if (!nonEmptyEntries.length) {
      notify('请添加药品信息');
      return;
    }
    const nameMissing = nonEmptyEntries.some((entry) => !entry.name.trim());
    if (nameMissing) {
      notify('请输入药品名称');
      return;
    }
    const doseMissing = nonEmptyEntries.some((entry) => !entry.amount || !entry.unit);
    if (doseMissing) {
      notify('请填写用量');
      return;
    }
    const medicineSummary = nonEmptyEntries.map((entry) => `${entry.name.trim()} ${entry.amount}${entry.unit}`).join('、');
    const nextPlans = nonEmptyEntries.map((entry) => ({
      id: `medicine-${entry.name.trim()}`,
      name: entry.name.trim(),
      dose: `${entry.amount}${entry.unit}`,
      frequency: '每日1次',
      period: '长期',
      takenToday: taken,
    }));
    const nextPlanNames = new Set(nextPlans.map((plan) => plan.name));
    onMedicinePlansChange([
      ...medicinePlans.filter((plan) => !nextPlanNames.has(plan.name)),
      ...nextPlans,
    ]);
    onSaved({
      type: 'medicine',
      time: takenTime,
      title: '吃药',
      detail: medicineSummary,
      detailRows: [
        ['药品', nonEmptyEntries.map((entry) => entry.name.trim()).join('、')],
        ['用量', nonEmptyEntries.map((entry) => `${entry.amount}${entry.unit}`).join('、')],
        ['服用时间', formatTime(takenTime)],
        ['状态', taken ? '今日已吃' : '已记录'],
      ],
    });
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.medicineScrollContent} showsVerticalScrollIndicator={false} bounces>
        <ScreenHeader title="吃药记录" onBack={onBack} />

        <Text style={styles.medicineSectionTitle}>记录本次用药</Text>
        <FormRow label="时间" required value={formatTime(takenTime)} chevron onPress={() => setTimePickerOpen(true)} />

        <View style={styles.medicineEntryCard}>
          <View style={styles.medicineEntryHeader}>
            <Text style={styles.medicineEntryTitle}>{medicinePlans.length ? '我的药品' : '药品信息'}</Text>
            <PillActionButton label="添加药品" icon onPress={() => appendMedicineEntry('')} />
          </View>
          <View style={styles.medicineEntryRows}>
            {medicineEntries.map((entry) => (
              <View key={entry.id} style={styles.medicineInputRow}>
                <TextInput
                  value={entry.name}
                  onChangeText={(value) => {
                    setActiveEntryId(entry.id);
                    setMedicineEntries((current) => current.map((item) => (
                      item.id === entry.id
                        ? { ...item, name: value, amount: item.amount ?? (value.trim() ? 1 : null), unit: item.unit || (value.trim() ? '滴' : '') }
                        : item
                    )));
                  }}
                  placeholder="输入药品名称"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.medicineNameInput, styles.webNoFocus]}
                />
                <View style={styles.medicineInputDivider} />
                <Pressable accessibilityRole="button" onPress={() => openDoseSheet(entry)} style={({ pressed }) => [styles.medicineDoseField, styles.webNoFocus, pressed && styles.pressed]}>
                  <Text numberOfLines={1} style={[styles.medicinePlaceholder, entry.amount ? styles.medicineRowName : null]}>
                    {entry.amount ? `${entry.amount}${entry.unit}` : '用量'}
                  </Text>
                </Pressable>
                {medicineEntries.length > 1 ? (
                  <Pressable accessibilityRole="button" accessibilityLabel={`删除${entry.name || '空白药品'}`} onPress={() => removeMedicineEntry(entry.id)} hitSlop={8} style={({ pressed }) => [styles.clearDotButton, pressed && styles.pressed]}>
                    <Text style={styles.clearDot}>×</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.drugChipWrap}>
          {commonDrugs.map((drug) => (
            <DrugChip
              key={drug}
              label={drug}
              onPress={() => {
                appendMedicineEntry(drug);
              }}
            />
          ))}
        </View>

        <Text style={styles.medicineSectionTitle}>已设置药品</Text>
        {medicinePlans.length ? medicinePlans.map((plan) => (
          <MedicineCard
            key={plan.id}
            title={`${plan.name}  ·  ${plan.dose}`}
            subtitle={`${plan.frequency}  ·  ${plan.period}  ·  ${plan.takenToday ? '今日已吃' : '今日未吃'}`}
            right={
              <Pressable
                accessibilityRole="button"
                onPress={() => onMedicinePlansChange(medicinePlans.map((item) => (
                  item.id === plan.id ? { ...item, takenToday: !item.takenToday } : item
                )))}
                style={styles.takenAction}
              >
                <Text style={styles.takenActionText}>{plan.takenToday ? '已吃' : '未吃'}</Text>
                <View style={[styles.checkCircle, plan.takenToday && styles.checkCircleActive]}>
                  {plan.takenToday ? <Text style={styles.checkMark}>✓</Text> : null}
                </View>
              </Pressable>
            }
          />
        )) : <Text style={styles.medicineEmptyText}>您还未设置任何药品</Text>}

        <View style={styles.medicineSectionHeader}>
          <Text style={styles.medicineSectionTitleNoMargin}>我的药品</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setEditingPlan(null);
              setEditSheetOpen(true);
            }}
            style={({ pressed }) => [styles.medicineNewButton, pressed && styles.pressed]}
          >
            <Text style={styles.medicineNewButtonText}>新建＋</Text>
          </Pressable>
        </View>
        {medicinePlans.length ? medicinePlans.map((plan) => (
          <MedicineCard
            key={`my-${plan.id}`}
            title={`${plan.name}  ·  进行中`}
            subtitle={`${plan.dose}  ·  ${plan.frequency}  ·  ${plan.period}服用`}
            actions={
              <View style={styles.myMedicineActions}>
                <PillActionButton
                  label="编辑"
                  variant="outline"
                  onPress={() => {
                    setEditingPlan(plan);
                    setEditSheetOpen(true);
                  }}
                />
                <PillActionButton
                  label="删除"
                  variant="outline"
                  onPress={() => {
                    onMedicinePlansChange(medicinePlans.filter((item) => item.id !== plan.id));
                    notify('已删除药品');
                  }}
                />
              </View>
            }
          />
        )) : <Text style={styles.medicineEmptyText}>您还未设置任何药品</Text>}

        <Text style={styles.disclaimer}>本功能仅用于记录和提醒，不提供用药建议。药品名称、剂量、频率和周期应以医生或药品说明为准。</Text>
      </ScrollView>

      <Pressable accessibilityRole="button" accessibilityLabel="保存吃药记录" onPress={saveMedicineRecord} style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}>
        <Text style={styles.saveText}>保存</Text>
      </Pressable>

      {doseSheetOpen ? (
        <DoseSheet
          doseAmount={doseAmount}
          doseUnit={doseUnit}
          onAmountChange={() => setDoseAmount((current) => (current >= 9 ? 1 : current + 1))}
          onUnitChange={setDoseUnit}
          onCancel={() => setDoseSheetOpen(false)}
          onConfirm={confirmDoseSheet}
        />
      ) : null}
      {timePickerOpen ? (
        <TimePickerSheet
          title="选择用药时间"
          value={takenTime}
          onCancel={() => setTimePickerOpen(false)}
          onConfirm={(date) => {
            setTakenTime(date);
            setTimePickerOpen(false);
          }}
        />
      ) : null}

      {editSheetOpen ? (
        <MedicineEditSheet
          initialPlan={editingPlan ?? undefined}
          onCancel={() => setEditSheetOpen(false)}
          notify={notify}
          onSave={(plan) => {
            const exists = medicinePlans.some((item) => item.id === plan.id);
            const nextPlans = exists
              ? medicinePlans.map((item) => (item.id === plan.id ? plan : item))
              : [...medicinePlans, plan];
            onMedicinePlansChange(nextPlans);
            setEditSheetOpen(false);
            setEditingPlan(null);
            notify('药品已保存');
          }}
        />
      ) : null}
    </>
  );
}

function LogIcon({ entry, size = 26 }: { entry: LogEntry; size?: number }) {
  return (
    <View style={[styles.logIconBubble, { width: size, height: size, borderRadius: size * 0.28, backgroundColor: entry.color }]}>
      <Image source={entry.icon} tintColor="#222229" style={{ width: size * 0.58, height: size * 0.58 }} resizeMode="contain" />
    </View>
  );
}

function LogFilterSheet({
  selectedTypes,
  onToggle,
  onReset,
  onCancel,
  onConfirm,
}: {
  selectedTypes: LogType[];
  onToggle: (type: LogType) => void;
  onReset: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <View style={styles.logFilterLayer}>
      <Pressable style={styles.modalScrim} onPress={onCancel} />
      <View style={styles.logFilterSheet}>
        <Text style={styles.sheetTitle}>筛选记录</Text>
        <View style={styles.optionSheetList}>
          {logFilterOptions.map((option) => {
            const selected = selectedTypes.includes(option.type);
            return (
              <Pressable
                key={option.type}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                onPress={() => onToggle(option.type)}
                style={({ pressed }) => [styles.optionSheetItem, selected && styles.optionSheetItemActive, pressed && styles.pressed]}
              >
                <Text style={[styles.optionSheetText, selected && styles.optionSheetTextActive]}>{option.label}</Text>
                {selected ? <Text style={styles.optionSheetCheck}>✓</Text> : null}
              </Pressable>
            );
          })}
        </View>
        <View style={styles.sheetActions}>
          <Pressable accessibilityRole="button" onPress={onReset} style={({ pressed }) => [styles.sheetCancel, pressed && styles.pressed]}>
            <Text style={styles.sheetCancelText}>重置</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onConfirm} style={({ pressed }) => [styles.sheetConfirm, pressed && styles.pressed]}>
            <Text style={styles.sheetConfirmText}>确定</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function LogAddMenu({ onCancel, onSelect }: { onCancel: () => void; onSelect: (label: string) => void }) {
  const addItems = ['喂食记录', '睡眠记录', '尿尿记录', '吃药记录'];

  return (
    <View style={styles.modalLayer}>
      <Pressable style={styles.modalScrim} onPress={onCancel} />
      <View style={styles.logAddSheet}>
        <Text style={styles.sheetTitle}>新增记录</Text>
        <View style={styles.logAddGrid}>
          {addItems.map((item) => (
            <Pressable key={item} accessibilityRole="button" onPress={() => onSelect(item)} style={({ pressed }) => [styles.logAddItem, pressed && styles.pressed]}>
              <Text style={styles.logAddItemText}>{item}</Text>
              <Text style={styles.logAddItemPlus}>＋</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function SleepTimerIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <View style={styles.sleepIcon}>
        <View style={styles.sleepPauseIcon}>
          <View style={styles.sleepPauseBar} />
          <View style={styles.sleepPauseBar} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.sleepIcon}>
      <View style={styles.sleepPlayIcon} />
    </View>
  );
}

function LogTimelineAxis({ time, variant }: { time: string; variant: 'start' | 'middle' | 'end' }) {
  return (
    <View style={styles.logTimeRail}>
      <Text style={styles.logTimeText}>{time}</Text>
      <View style={styles.logRailAxis}>
        <View style={styles.logRailTopSlot}>
          {variant !== 'start' ? <View style={styles.logTimeLine} /> : null}
        </View>
        <View style={styles.logTimeDot} />
        <View style={styles.logRailBottomSlot}>
          {variant !== 'end' ? <View style={styles.logTimeLine} /> : null}
        </View>
      </View>
    </View>
  );
}

function LogScreen({ records, onBack, onEntryPress, onAddPress }: { records: LogEntry[]; onBack: () => void; onEntryPress: (entry: LogEntry) => void; onAddPress: (label: string) => void }) {
  const [selectedDay, setSelectedDay] = useState('16');
  const [filterOpen, setFilterOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<LogType[]>(logFilterOptions.map((item) => item.type));
  const selectedEntries = useMemo(() => getLogEntriesForDay(selectedDay, records), [records, selectedDay]);
  const filteredEntries = selectedEntries.filter((entry) => selectedTypes.includes(entry.type));
  const countByType = (type: LogType) => selectedEntries.filter((entry) => entry.type === type).length;
  const sleepMinutes = selectedEntries.filter((entry) => entry.type === 'sleep').reduce((total, entry) => {
    const durationRow = entry.detailRows?.find(([label]) => label === '总时长')?.[1] ?? '';
    const hourMatch = durationRow.match(/(\d+)小时/);
    const minuteMatch = durationRow.match(/(\d+)分钟/);
    return total + (hourMatch ? Number(hourMatch[1]) * 60 : 0) + (minuteMatch ? Number(minuteMatch[1]) : 0);
  }, 0);
  const sleepLabel = sleepMinutes > 0 ? `${Math.floor(sleepMinutes / 60)}小时${sleepMinutes % 60}分` : '0小时';
  const summaryItems = [
    { label: `喂养 ${String(countByType('feeding')).padStart(2, '0')}次`, entry: selectedEntries.find((item) => item.type === 'feeding') ?? defaultLogEntry },
    { label: `屎尿 ${String(countByType('diaper')).padStart(2, '0')}次`, entry: selectedEntries.find((item) => item.type === 'diaper') ?? defaultLogEntry },
    { label: `睡眠 ${sleepLabel}`, entry: selectedEntries.find((item) => item.type === 'sleep') ?? defaultLogEntry },
    { label: `吃药 ${countByType('medicine')}次`, entry: selectedEntries.find((item) => item.type === 'medicine') ?? defaultLogEntry },
  ];

  return (
    <>
      <ScrollView contentContainerStyle={styles.logScrollContent} horizontal={false} showsVerticalScrollIndicator={false} bounces>
        <ScreenHeader title="日志" onBack={onBack} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.logDateStrip}>
          {logDateItems.map((item) => {
            const active = selectedDay === item.day;
            return (
            <Pressable key={`${item.week}-${item.day}`} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => setSelectedDay(item.day)} style={({ pressed }) => [styles.logDatePill, active && styles.logDatePillActive, pressed && styles.pressed]}>
              <Text style={[styles.logDateWeek, active && styles.logDateWeekActive]}>{item.week}</Text>
              <Text style={[styles.logDateDay, active && styles.logDateDayActive]}>{item.day}</Text>
            </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.logSummaryCard}>
          <Text style={styles.logDateTitle}>6月{selectedDay}日</Text>
          <View style={styles.logSummaryGrid}>
            {summaryItems.map((item, index) => (
              <View key={`${item.label}-${index}`} style={styles.logSummaryItem}>
                <LogIcon entry={item.entry} size={26} />
                <Text numberOfLines={1} style={styles.logSummaryText}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.logTimelineHeader}>
          <Text style={styles.logTimelineTitle}>记录时间线</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="筛选记录" onPress={() => setFilterOpen(true)} style={({ pressed }) => [styles.logFilterButton, pressed && styles.pressed]}>
            <Text style={styles.logFilterIcon}>≡</Text>
          </Pressable>
        </View>

        <View style={styles.logTimeline}>
          {filteredEntries.map((entry, index) => {
            const variant = index === 0 ? 'start' : index === filteredEntries.length - 1 ? 'end' : 'middle';
            return (
            <View key={entry.id} style={styles.logTimelineRow}>
              <LogTimelineAxis time={entry.time} variant={variant} />
              <Pressable accessibilityRole="button" accessibilityLabel={`${entry.time} ${entry.title} ${entry.detail}`} onPress={() => onEntryPress(entry)} style={({ pressed }) => [styles.logTimelineCard, pressed && styles.pressed]}>
                <LogIcon entry={entry} size={26} />
                <View style={styles.logTimelineCopy}>
                  <Text style={styles.logTimelineCardTitle}>{entry.title}</Text>
                  <Text style={styles.logTimelineCardMeta}>{entry.detail}</Text>
                </View>
              </Pressable>
            </View>
          );
          })}
          {!filteredEntries.length ? <EmptyState text="空空如也~" /> : null}
        </View>
      </ScrollView>

      <Pressable accessibilityRole="button" accessibilityLabel="新增记录" onPress={() => setAddMenuOpen(true)} style={({ pressed }) => [styles.logFab, pressed && styles.pressed]}>
        <Text style={styles.logFabText}>＋</Text>
      </Pressable>
      {filterOpen ? (
        <LogFilterSheet
          selectedTypes={selectedTypes}
          onToggle={(type) => setSelectedTypes((current) => {
            if (current.includes(type)) {
              const next = current.filter((item) => item !== type);
              return next.length ? next : current;
            }
            return [...current, type];
          })}
          onReset={() => setSelectedTypes(logFilterOptions.map((item) => item.type))}
          onCancel={() => setFilterOpen(false)}
          onConfirm={() => setFilterOpen(false)}
        />
      ) : null}
      {addMenuOpen ? (
        <LogAddMenu
          onCancel={() => setAddMenuOpen(false)}
          onSelect={(label) => {
            setAddMenuOpen(false);
            onAddPress(label);
          }}
        />
      ) : null}
    </>
  );
}

function ConfirmDeleteSheet({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <View style={styles.modalLayer}>
      <Pressable style={styles.modalScrim} onPress={onCancel} />
      <View style={styles.confirmDeleteSheet}>
        <Text style={styles.confirmDeleteTitle}>是否确认删除？</Text>
        <Text style={styles.confirmDeleteText}>删除后，这条记录会从日志时间线中移除。</Text>
        <View style={styles.confirmDeleteActions}>
          <Pressable accessibilityRole="button" onPress={onCancel} style={({ pressed }) => [styles.confirmCancelButton, pressed && styles.pressed]}>
            <Text style={styles.confirmCancelText}>取消</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onConfirm} style={({ pressed }) => [styles.confirmDeleteButton, pressed && styles.pressed]}>
            <Text style={styles.confirmDeleteButtonText}>删除</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function LogDetailScreen({ entry, onBack, onEdit, onDelete }: { entry: LogEntry; onBack: () => void; onEdit: () => void; onDelete: () => void }) {
  const detailRows = entry.detailRows ?? [
    ['喂养方式', '配方奶'],
    ['奶量', '120 ml'],
    ['开始时间', '10:20'],
    ['结束时间', '10:35'],
    ['备注', '无'],
  ];

  return (
    <>
      <ScrollView contentContainerStyle={styles.logDetailScrollContent} showsVerticalScrollIndicator={false} bounces>
        <ScreenHeader title="记录详情" onBack={onBack} />

        <View style={styles.logDetailHero}>
          <LogIcon entry={entry} size={26} />
          <View style={styles.logDetailHeroCopy}>
            <Text style={styles.logDetailHeroTitle}>{entry.title}</Text>
            <Text style={styles.logDetailHeroMeta}>{entry.detail}</Text>
          </View>
        </View>

        <View style={styles.logDetailRows}>
          {detailRows.map(([label, value]) => (
            <View key={label} style={styles.logDetailRow}>
              <Text style={styles.logDetailLabel}>{label}</Text>
              <Text style={styles.logDetailValue}>{value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.logDetailActions}>
        <Pressable accessibilityRole="button" accessibilityLabel="编辑记录" onPress={onEdit} style={({ pressed }) => [styles.logEditButton, pressed && styles.pressed]}>
          <Text style={styles.logEditText}>编辑记录</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="删除记录" onPress={onDelete} style={({ pressed }) => [styles.logDeleteButton, pressed && styles.pressed]}>
          <Text style={styles.logDeleteText}>删除记录</Text>
        </Pressable>
      </View>
    </>
  );
}

function ProfileScreen({
  profile,
  photos,
  onBack,
  onEditProfile,
  onPhotoPress,
  onAddPhoto,
}: {
  profile: BabyProfile;
  photos: ProfilePhotoRecord[];
  onBack: () => void;
  onEditProfile: () => void;
  onPhotoPress: (photo: ProfilePhotoRecord) => void;
  onAddPhoto: () => void;
}) {
  const photoGroups = groupProfilePhotos(photos);

  return (
    <>
      <ScrollView contentContainerStyle={styles.profileScrollContent} showsVerticalScrollIndicator={false} bounces>
        <ScreenHeader title="我的" onBack={onBack} />

        <View style={styles.profileArchiveCard}>
          <View style={styles.profileArchiveHeader}>
            <Text style={styles.profileArchiveTitle}>{profile.nickname}的档案</Text>
            <Pressable accessibilityRole="button" onPress={onEditProfile} hitSlop={10}>
              <Text style={styles.profileArchiveEdit}>编辑宝宝档案</Text>
            </Pressable>
          </View>
          <Image source={getBabyAvatarSource(profile)} style={styles.profileAvatarLarge} resizeMode="cover" />
          <Text style={styles.profileAge}>{calculateBabyAgeText(profile.birthDate)}</Text>
          <View style={styles.profileStats}>
            {[
              ['性别', profile.gender],
              ['身高', profile.birthHeight],
              ['体重', profile.birthWeight],
              ['出生日期', profile.birthDate],
            ].map(([label, value]) => (
              <View key={label} style={styles.profileStatItem}>
                <Text style={styles.profileStatLabel}>{label}</Text>
                <Text style={styles.profileStatValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.profilePhotoTitle}>照片记录</Text>
        {photoGroups.length ? photoGroups.map((group) => (
          <View key={group.label} style={styles.profilePhotoGroup}>
            <Text style={styles.profilePhotoDate}>{group.label}</Text>
            <View style={styles.profilePhotoGridToday}>
              {group.photos.map((photo, index) => (
                <Pressable
                  key={photo.id}
                  accessibilityRole="button"
                  accessibilityLabel={`查看${group.label}照片${index + 1}`}
                  onPress={() => onPhotoPress(photo)}
                  style={({ pressed }) => [styles.profilePhotoThumbSmall, pressed && styles.pressed]}
                >
                  <Image source={{ uri: photo.uri }} style={styles.profilePhotoImage} resizeMode="cover" />
                </Pressable>
              ))}
            </View>
          </View>
        )) : <EmptyState text="还没有照片记录" />}
      </ScrollView>

      <Pressable accessibilityRole="button" accessibilityLabel="添加照片" onPress={onAddPhoto} style={({ pressed }) => [styles.logFab, styles.profileFab, pressed && styles.pressed]}>
        <Text style={styles.logFabText}>＋</Text>
      </Pressable>
    </>
  );
}

function AvatarPickerSheet({
  value,
  onCancel,
  onSelect,
}: {
  value: BabyAvatarId;
  onCancel: () => void;
  onSelect: (value: BabyAvatarId) => void;
}) {
  const options: Array<{ id: BabyAvatarId; label: string; helper: string }> = [
    { id: 'default', label: '当前照片', helper: '使用默认宝宝头像' },
    { id: 'boy', label: '从相册选择', helper: '模拟选择一张新照片' },
    { id: 'girl', label: '拍照更换', helper: '模拟拍摄一张新照片' },
  ];

  return (
    <View style={styles.modalLayer}>
      <Pressable style={styles.modalScrim} onPress={onCancel} />
      <View style={styles.avatarPickerSheet}>
        <Text style={styles.sheetTitle}>更换宝宝头像</Text>
        <View style={styles.avatarPickerList}>
          {options.map((option) => {
            const selected = option.id === value;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                onPress={() => onSelect(option.id)}
                style={({ pressed }) => [styles.avatarPickerItem, selected && styles.avatarPickerItemActive, pressed && styles.pressed]}
              >
                <Image source={babyAvatarSources[option.id]} style={styles.avatarPickerImage} resizeMode="cover" />
                <View style={styles.avatarPickerCopy}>
                  <Text style={styles.avatarPickerTitle}>{option.label}</Text>
                  <Text style={styles.avatarPickerHelper}>{option.helper}</Text>
                </View>
                {selected ? <Text style={styles.avatarPickerCheck}>✓</Text> : null}
              </Pressable>
            );
          })}
        </View>
        <Pressable accessibilityRole="button" onPress={onCancel} style={({ pressed }) => [styles.avatarPickerCancel, pressed && styles.pressed]}>
          <Text style={styles.avatarPickerCancelText}>取消</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ProfileEditScreen({ profile, onBack, onSaved, notify }: { profile: BabyProfile; onBack: () => void; onSaved: (profile: BabyProfile) => void; notify: Notify }) {
  const [nickname, setNickname] = useState(profile.nickname);
  const [birthDate, setBirthDate] = useState(() => parseYmd(profile.birthDate));
  const [feeding, setFeeding] = useState(profile.feeding);
  const [gender, setGender] = useState(profile.gender);
  const [birthWeight, setBirthWeight] = useState(profile.birthWeight);
  const [birthHeight, setBirthHeight] = useState(profile.birthHeight);
  const [premature, setPremature] = useState(profile.premature);
  const [gestationalAge, setGestationalAge] = useState(profile.gestationalAge);
  const [specialNote, setSpecialNote] = useState(profile.specialNote);
  const [avatarId, setAvatarId] = useState<BabyAvatarId>(profile.avatarId ?? 'default');
  const [dateOpen, setDateOpen] = useState(false);
  const [optionField, setOptionField] = useState<ProfileOptionField | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  const optionConfig = optionField
    ? {
      feeding: { title: '选择喂养方式', options: feedingPreferenceOptions, value: feeding, setValue: setFeeding },
      gender: { title: '选择性别', options: genderOptions, value: gender, setValue: setGender },
      premature: { title: '是否早产', options: prematureOptions, value: premature, setValue: setPremature },
    }[optionField]
    : null;

  const saveProfile = () => {
    if (!nickname.trim()) {
      notify('请输入宝宝昵称');
      return;
    }
    if (!birthDate) {
      notify('请选择出生日期');
      return;
    }
    if (!feeding) {
      notify('请选择喂养方式');
      return;
    }
    onSaved({
      nickname: nickname.trim(),
      birthDate: formatYmd(birthDate),
      feeding,
      gender,
      birthWeight,
      birthHeight,
      premature,
      gestationalAge,
      specialNote,
      avatarId,
    });
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.profileEditScrollContent} showsVerticalScrollIndicator={false} bounces>
        <ScreenHeader title="编辑宝宝档案" onBack={onBack} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="更换宝宝头像"
          onPress={() => setAvatarPickerOpen(true)}
          style={({ pressed }) => [styles.profileEditAvatarCard, pressed && styles.pressed]}
        >
          <View style={styles.profileEditAvatarWrap}>
            <Image source={babyAvatarSources[avatarId]} style={styles.profileEditAvatar} resizeMode="cover" />
            <View style={styles.profileEditCameraBadge}>
              <Text style={styles.profileEditCameraText}>＋</Text>
            </View>
          </View>
          <View style={styles.profileEditAvatarCopy}>
            <Text style={styles.profileEditAvatarTitle}>宝宝头像</Text>
            <Text style={styles.profileEditAvatarHint}>点击更换照片</Text>
          </View>
          <Text style={styles.profileEditAvatarChevron}>›</Text>
        </Pressable>

        <View style={styles.profileEditRows}>
          <InlineInputRow label="宝宝昵称" required value={nickname} placeholder="请输入宝宝昵称" onChangeText={setNickname} />
          <FormRow label="出生日期" required value={formatYmd(birthDate)} chevron onPress={() => setDateOpen(true)} />
          <FormRow label="当前喂养方式" required value={feeding} chevron onPress={() => setOptionField('feeding')} />
          <FormRow label="性别" value={gender} chevron onPress={() => setOptionField('gender')} />
          <InlineInputRow label="出生体重" value={birthWeight} placeholder="请输入出生体重" onChangeText={setBirthWeight} />
          <InlineInputRow label="出生身高" value={birthHeight} placeholder="请输入出生身高" onChangeText={setBirthHeight} />
          <FormRow label="是否早产" value={premature} chevron onPress={() => setOptionField('premature')} />
          <InlineInputRow label="孕周" value={gestationalAge} placeholder="请输入孕周" onChangeText={setGestationalAge} />
          <FormRow label="特殊备注" value={specialNote || '过敏、医生嘱咐等'} muted={!specialNote} chevron onPress={() => setNoteOpen(true)} />
        </View>
      </ScrollView>

      <Pressable accessibilityRole="button" accessibilityLabel="保存宝宝档案" onPress={saveProfile} style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}>
        <Text style={styles.saveText}>保存</Text>
      </Pressable>
      {dateOpen ? (
        <DateOnlyPickerSheet
          title="选择出生日期"
          value={birthDate}
          onCancel={() => setDateOpen(false)}
          onConfirm={(value) => {
            setBirthDate(value);
            setDateOpen(false);
          }}
        />
      ) : null}
      {optionConfig ? (
        <OptionPickerSheet
          title={optionConfig.title}
          options={optionConfig.options}
          value={optionConfig.value}
          onCancel={() => setOptionField(null)}
          onConfirm={(value) => {
            optionConfig.setValue(value);
            setOptionField(null);
          }}
        />
      ) : null}
      {noteOpen ? (
        <TextInputSheet
          title="填写特殊备注"
          value={specialNote}
          placeholder="过敏、医生嘱咐等"
          onCancel={() => setNoteOpen(false)}
          onConfirm={(value) => {
            setSpecialNote(value);
            setNoteOpen(false);
          }}
        />
      ) : null}
      {avatarPickerOpen ? (
        <AvatarPickerSheet
          value={avatarId}
          onCancel={() => setAvatarPickerOpen(false)}
          onSelect={(nextAvatarId) => {
            setAvatarId(nextAvatarId);
            setAvatarPickerOpen(false);
            notify('头像已更新');
          }}
        />
      ) : null}
    </>
  );
}

function ProfilePhotoScreen({ photo, onClose, onAddPhoto }: { photo: ProfilePhotoRecord | null; onClose: () => void; onAddPhoto: () => void }) {
  return (
    <View style={styles.photoViewer}>
      <View style={styles.photoViewerDimContent}>
        <ScreenHeader title="成长照片" onBack={onClose} />
        <Text style={styles.photoViewerDate}>{photo ? formatProfilePhotoDate(new Date(photo.takenAt)) : '照片记录'}</Text>
        <View style={styles.photoViewerMockCard}>
          <Text style={styles.photoViewerMockTitle}>{photo?.name ?? '暂无照片'}</Text>
          <Text style={styles.photoViewerMockTime}>{photo ? formatTime(new Date(photo.takenAt)) : '--:--'}</Text>
        </View>
      </View>

      <View style={styles.photoViewerOverlay}>
        <View style={styles.photoViewerTop}>
          <Pressable accessibilityRole="button" accessibilityLabel="关闭照片" onPress={onClose} style={({ pressed }) => [styles.photoCloseButton, pressed && styles.pressed]}>
            <Text style={styles.photoCloseText}>×</Text>
          </Pressable>
          <Text style={styles.photoCounter}>1 / 1</Text>
        </View>
        {photo ? <Image source={{ uri: photo.uri }} style={styles.photoViewerImage} resizeMode="cover" /> : <EmptyState text="还没有照片记录" />}
        <Text style={styles.photoViewerCaption}>{formatProfilePhotoCaption(photo)}</Text>
        <View style={styles.photoDots}>
          <View style={[styles.photoDot, styles.photoDotActive]} />
          <View style={styles.photoDot} />
          <View style={styles.photoDot} />
          <View style={styles.photoDot} />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="添加照片" onPress={onAddPhoto} style={({ pressed }) => [styles.photoAddButton, pressed && styles.pressed]}>
          <Text style={styles.photoAddText}>添加照片</Text>
        </Pressable>
      </View>
    </View>
  );
}

const onboardingSteps = [
  {
    title: '先告诉我，宝宝叫什么呀？',
    subtitle: '之后我会用这个名字陪你一起记录宝宝的每一天。',
  },
  {
    title: '宝宝是哪天来到这个世界的？',
    subtitle: '我会根据生日帮你计算月龄、疫苗时间和照护提醒。',
  },
  {
    title: '现在主要怎么喂养宝宝？',
    subtitle: '这会影响喂食记录的默认选项，之后也可以随时修改。',
  },
  {
    title: '宝宝是小王子还是小公主？',
    subtitle: '这会帮助我更准确地记录宝宝档案。',
  },
  {
    title: '好了，奶爸准备就绪',
    subtitle: '从今天开始，我们一起照顾好宝宝。',
  },
];

function padDateValue(value: number) {
  return String(value).padStart(2, '0');
}

function OnboardingOption({
  label,
  selected,
  onPress,
  wide,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  wide?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.onboardingOption,
        styles.webNoFocus,
        wide && styles.onboardingOptionWide,
        selected && styles.onboardingOptionActive,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.onboardingOptionText, selected && styles.onboardingOptionTextActive]}>{label}</Text>
    </Pressable>
  );
}

function DatePickerColumn({
  label,
  value,
  previous,
  next,
  onPrevious,
  onNext,
}: {
  label: string;
  value: string;
  previous: string;
  next: string;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.onboardingDateColumn}>
      <Text style={styles.onboardingDateLabel}>{label}</Text>
      <Pressable accessibilityRole="button" onPress={onPrevious} hitSlop={8}>
        <Text style={styles.onboardingDateMuted}>{previous}</Text>
      </Pressable>
      <View style={styles.onboardingDateSelected}>
        <Text style={styles.onboardingDateSelectedText}>{value}</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={onNext} hitSlop={8}>
        <Text style={styles.onboardingDateMuted}>{next}</Text>
      </Pressable>
    </View>
  );
}

function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [babyName, setBabyName] = useState('');
  const [birthYear, setBirthYear] = useState(2026);
  const [birthMonth, setBirthMonth] = useState(5);
  const [birthDay, setBirthDay] = useState(16);
  const [feedingPreference, setFeedingPreference] = useState('');
  const [gender, setGender] = useState('');
  const currentStep = onboardingSteps[step]!;
  const isCompleteStep = step === onboardingSteps.length - 1;
  const canGoNext = (
    (step === 0 && babyName.trim().length > 0)
    || step === 1
    || (step === 2 && feedingPreference.length > 0)
    || (step === 3 && gender.length > 0)
    || isCompleteStep
  );

  const goNext = () => {
    if (!canGoNext) return;
    if (isCompleteStep) {
      onDone();
      return;
    }
    setStep((current) => Math.min(current + 1, onboardingSteps.length - 1));
  };

  const goBack = () => {
    if (step === 0) {
      onDone();
      return;
    }
    setStep((current) => Math.max(current - 1, 0));
  };

  const renderStepContent = () => {
    if (step === 0) {
      return (
        <View style={styles.onboardingInputStage}>
          <View style={styles.onboardingInputCard}>
            <Text style={styles.onboardingInputLabel}>宝宝昵称</Text>
            <TextInput
              accessibilityLabel="宝宝昵称"
              value={babyName}
              onChangeText={setBabyName}
              placeholder="请输入"
              placeholderTextColor={colors.textSecondary}
              style={[styles.onboardingTextInput, styles.webNoFocus]}
            />
          </View>
        </View>
      );
    }

    if (step === 1) {
      return (
        <View style={styles.onboardingDateStage}>
          <View style={styles.onboardingDateCard}>
            <DatePickerColumn
              label="年"
              value={String(birthYear)}
              previous={String(birthYear - 1)}
              next={String(birthYear + 1)}
              onPrevious={() => setBirthYear((value) => value - 1)}
              onNext={() => setBirthYear((value) => value + 1)}
            />
            <DatePickerColumn
              label="月"
              value={padDateValue(birthMonth)}
              previous={padDateValue(birthMonth === 1 ? 12 : birthMonth - 1)}
              next={padDateValue(birthMonth === 12 ? 1 : birthMonth + 1)}
              onPrevious={() => setBirthMonth((value) => (value === 1 ? 12 : value - 1))}
              onNext={() => setBirthMonth((value) => (value === 12 ? 1 : value + 1))}
            />
            <DatePickerColumn
              label="日"
              value={padDateValue(birthDay)}
              previous={padDateValue(birthDay === 1 ? 31 : birthDay - 1)}
              next={padDateValue(birthDay === 31 ? 1 : birthDay + 1)}
              onPrevious={() => setBirthDay((value) => (value === 1 ? 31 : value - 1))}
              onNext={() => setBirthDay((value) => (value === 31 ? 1 : value + 1))}
            />
          </View>
        </View>
      );
    }

    if (step === 2) {
      return (
        <View style={styles.onboardingOptionStage}>
          <View style={styles.onboardingGrid}>
            {['母乳', '配方奶', '混合喂养', '暂不确定'].map((item) => (
              <OnboardingOption key={item} label={item} selected={feedingPreference === item} onPress={() => setFeedingPreference(item)} />
            ))}
          </View>
        </View>
      );
    }

    if (step === 3) {
      return (
        <View style={styles.onboardingGenderStage}>
          <View style={styles.onboardingGenderRow}>
            {['男孩', '女孩'].map((item) => (
              <OnboardingOption key={item} label={item} selected={gender === item} onPress={() => setGender(item)} />
            ))}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.onboardingCompleteStage}>
      </View>
    );
  };

  const renderArtwork = () => {
    if (step === 0) return <Image source={require('./assets/onboarding-figma-nickname.png')} style={styles.onboardingNicknameImage} resizeMode="cover" />;
    if (step === 1) return <Image source={require('./assets/onboarding-figma-birth.png')} style={styles.onboardingBirthImage} resizeMode="cover" />;
    if (step === 2) return <Image source={require('./assets/onboarding-figma-feeding.png')} style={styles.onboardingFeedingImage} resizeMode="cover" />;
    if (step === 3) {
      return (
        <>
          <Image source={require('./assets/onboarding-figma-boy.png')} style={styles.onboardingBoyImage} resizeMode="cover" />
          <Image source={require('./assets/onboarding-figma-girl.png')} style={styles.onboardingGirlImage} resizeMode="cover" />
        </>
      );
    }
    return (
      <>
        <Image source={require('./assets/onboarding-figma-complete.png')} style={styles.onboardingCompleteImage} resizeMode="cover" />
        <View style={[styles.onboardingStar, styles.onboardingStarOne, starBackground(onboardingStars.one)]} />
        <View style={[styles.onboardingStar, styles.onboardingStarTwo, starBackground(onboardingStars.two)]} />
        <View style={[styles.onboardingStar, styles.onboardingStarThree, starBackground(onboardingStars.three)]} />
        <View style={[styles.onboardingStar, styles.onboardingStarFour, starBackground(onboardingStars.four)]} />
      </>
    );
  };

  return (
    <View style={styles.onboardingPage}>
      <View style={styles.onboardingHeader}>
        <Pressable accessibilityRole="button" accessibilityLabel="返回上一步" onPress={goBack} style={({ pressed }) => [styles.backCircle, styles.webNoFocus, pressed && styles.pressed]}>
          <Image source={require('./assets/icon-chevron.png')} style={styles.backIcon} resizeMode="contain" />
        </Pressable>
        <View style={styles.onboardingProgress}>
          <Text style={styles.onboardingProgressText}>{step + 1} / {onboardingSteps.length}</Text>
        </View>
      </View>

      <View style={styles.onboardingBody}>
        <View style={[styles.onboardingQuestion, isCompleteStep && styles.onboardingQuestionCenter]}>
          <Text style={[styles.onboardingTitle, isCompleteStep && styles.onboardingTitleCenter]}>{currentStep.title}</Text>
          <Text style={[styles.onboardingSubtitle, isCompleteStep && styles.onboardingSubtitleCenter]}>{currentStep.subtitle}</Text>
        </View>

        {renderStepContent()}
      </View>

      {renderArtwork()}

      <View style={styles.onboardingActions}>
        {!isCompleteStep ? (
          <Pressable accessibilityRole="button" onPress={goBack} style={({ pressed }) => [styles.onboardingSecondaryButton, styles.webNoFocus, pressed && styles.pressed]}>
            <Text style={styles.onboardingSecondaryButtonText}>上一步</Text>
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: !canGoNext }} disabled={!canGoNext} onPress={goNext} style={({ pressed }) => [styles.onboardingPrimaryButton, !isCompleteStep && styles.onboardingPrimaryButtonWithSecondary, !canGoNext && styles.onboardingPrimaryButtonDisabled, styles.webNoFocus, pressed && canGoNext && styles.pressed]}>
          <Text style={styles.onboardingPrimaryButtonText}>{isCompleteStep ? '进入首页' : '下一步'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function KnowledgeCard({ article, onPress }: { article: KnowledgeArticle; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={article.title} onPress={onPress} style={({ pressed }) => [styles.knowledgeCard, pressed && styles.pressed]}>
      <Image source={article.image} style={styles.knowledgeCardImage} resizeMode="cover" />
      <View style={styles.knowledgeCardContent}>
        <Text style={styles.knowledgeCategory}>{article.category}</Text>
        <Text numberOfLines={2} style={styles.knowledgeCardTitle}>{article.title}</Text>
        <Text numberOfLines={2} style={styles.knowledgeCardSummary}>{article.summary}</Text>
        <Text numberOfLines={1} style={styles.knowledgeCardMeta}>{article.meta}</Text>
      </View>
    </Pressable>
  );
}

function KnowledgeScreen({ articles, onBack, onOpenArticle }: { articles: KnowledgeArticle[]; onBack: () => void; onOpenArticle: (article: KnowledgeArticle) => void }) {
  const [activeTab, setActiveTab] = useState('推荐');
  const [query, setQuery] = useState('');
  const tabs = ['推荐', '百科', '饮食', '护理要点'];
  const tabArticles = activeTab === '推荐' ? articles : articles.filter((article) => article.category === activeTab);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleArticles = normalizedQuery
    ? tabArticles.filter((article) => (
      article.title.toLowerCase().includes(normalizedQuery)
      || article.summary.toLowerCase().includes(normalizedQuery)
      || article.category.toLowerCase().includes(normalizedQuery)
      || article.meta.toLowerCase().includes(normalizedQuery)
    ))
    : tabArticles;

  return (
    <ScrollView contentContainerStyle={styles.knowledgeScrollContent} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="育儿知识" onBack={onBack} />

      <TextInput
        accessibilityLabel="搜索育儿知识"
        value={query}
        onChangeText={setQuery}
        placeholder="搜索育儿知识、喂养、护理、疫苗..."
        placeholderTextColor={colors.textSecondary}
        returnKeyType="search"
        style={[styles.knowledgeSearch, styles.webNoFocus]}
      />

      <View style={styles.knowledgeTabs}>
        {tabs.map((tabName) => {
          const active = tabName === activeTab;
          return (
            <Pressable
              key={tabName}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setActiveTab(tabName)}
              style={({ pressed }) => [styles.knowledgeTab, active && styles.knowledgeTabActive, pressed && styles.pressed]}
            >
              <Text style={[styles.knowledgeTabText, active && styles.knowledgeTabTextActive]}>{tabName}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.knowledgeList}>
        {visibleArticles.map((article) => (
          <KnowledgeCard key={article.id} article={article} onPress={() => onOpenArticle(article)} />
        ))}
        {!visibleArticles.length ? <EmptyState text="没有找到相关内容" /> : null}
      </View>
    </ScrollView>
  );
}

function KnowledgeTag({ label }: { label: string }) {
  return (
    <View style={styles.knowledgeDetailTag}>
      <Text style={styles.knowledgeDetailTagText}>{label}</Text>
    </View>
  );
}

function KnowledgeDetailSectionTitle({ icon, title, large }: { icon: ImageSourcePropType; title: string; large?: boolean }) {
  return (
    <View style={styles.knowledgeDetailSectionHead}>
      <Image source={icon} style={[styles.knowledgeDetailIconImage, large && styles.knowledgeDetailIconImageLarge]} resizeMode="contain" />
      <Text style={styles.knowledgeDetailSectionTitle}>{title}</Text>
    </View>
  );
}

function KnowledgeDetailScreen({ article, onBack }: { article: KnowledgeArticle; onBack: () => void }) {
  return (
    <View style={styles.knowledgeDetailPage}>
      <View style={styles.knowledgeDetailHeader}>
        <Pressable accessibilityRole="button" accessibilityLabel="返回育儿知识" onPress={onBack} style={({ pressed }) => [styles.backCircle, pressed && styles.pressed]}>
          <Image source={require('./assets/icon-chevron.png')} style={styles.backIcon} resizeMode="contain" />
        </Pressable>
        <Text style={styles.knowledgeDetailNavTitle}>知识详情</Text>
      </View>

      <ScrollView style={styles.knowledgeDetailScroll} contentContainerStyle={styles.knowledgeDetailContent} showsVerticalScrollIndicator={false}>
        <View style={styles.knowledgeHero}>
          <Image source={article.heroImage} style={styles.knowledgeHeroImage} resizeMode="cover" />
          <View style={styles.knowledgeHeroOverlay} />
        </View>

        <View style={styles.knowledgeTitleCard}>
          <Text style={styles.knowledgeDetailTitle}>{article.title}</Text>
          <View style={styles.knowledgeDetailTags}>
            <KnowledgeTag label={article.meta.split('·')[0]?.trim() || '2月龄'} />
            <KnowledgeTag label={article.category} />
            <KnowledgeTag label="育儿知识" />
          </View>
          <View style={styles.knowledgeDetailMetaRow}>
            <Text style={styles.knowledgeDetailMetaText}>儿科专家团队编审</Text>
            <Text style={styles.knowledgeDetailDivider}>|</Text>
            <Text style={styles.knowledgeDetailMetaText}>3分钟阅读</Text>
          </View>
        </View>

        <View style={styles.knowledgeConclusionCard}>
          <KnowledgeDetailSectionTitle icon={require('./assets/knowledge-detail-core-icon.png')} title="核心结论" />
          <Text style={styles.knowledgeParagraph}>
            {article.core}
          </Text>
        </View>

        <View style={styles.knowledgeDadCard}>
          <KnowledgeDetailSectionTitle icon={require('./assets/knowledge-detail-dad-icon.png')} title="爸爸可以怎么做" />
          {article.dadTips.map((item, index) => (
            <View key={item} style={styles.knowledgeDadStep}>
              <View style={styles.knowledgeStepNumber}>
                <Text style={styles.knowledgeStepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.knowledgeDadText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.knowledgeStepsCard}>
          <KnowledgeDetailSectionTitle icon={require('./assets/knowledge-detail-steps-icon.png')} title="操作步骤" />
          <View style={styles.knowledgeStepsList}>
            {article.steps.map((step, index) => (
              <Text key={step} style={styles.knowledgeStepLine}>
                <Text style={styles.knowledgeStepBold}>{index + 1}. </Text>{step}
              </Text>
            ))}
          </View>
          <View style={styles.knowledgeObserveBlock}>
            <Text style={styles.knowledgeObserveTitle}>需要观察什么？</Text>
            <View style={styles.knowledgeObserveTags}>
              {article.observeTags.map((tag) => <KnowledgeTag key={tag} label={tag} />)}
            </View>
          </View>
        </View>

        <View style={styles.knowledgeDoctorCard}>
          <KnowledgeDetailSectionTitle icon={require('./assets/knowledge-detail-doctor-icon.png')} title="什么时候咨询医生？" large />
          <Text style={styles.knowledgeDoctorText}>{article.doctorAdvice}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function VaccineRadio({ checked }: { checked: boolean }) {
  return (
    <View style={[styles.vaccineRadio, checked && styles.vaccineRadioChecked]}>
      {checked ? <Text style={styles.vaccineRadioCheck}>✓</Text> : null}
    </View>
  );
}

function VaccineReminderCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="查看疫苗须知" onPress={onPress} style={({ pressed }) => [styles.vaccineReminderCard, pressed && styles.pressed]}>
      <View style={styles.vaccineReminderBody}>
        <View style={styles.vaccineReminderIcon}>
          <Image source={require('./assets/icon-vaccine.png')} tintColor="#F54900" style={styles.vaccineReminderIconImage} resizeMode="contain" />
        </View>
        <View style={styles.vaccineReminderCopy}>
          <Text style={styles.vaccineReminderTitle}>疫苗须知</Text>
          <Text style={styles.vaccineReminderMeta}>接种前后注意事项、常见问题 · 查看</Text>
        </View>
      </View>
      <Image source={require('./assets/icon-chevron.png')} style={styles.vaccineReminderChevron} resizeMode="contain" />
    </Pressable>
  );
}

function VaccineCard({
  item,
  completed,
  date,
  onToggle,
  onChangeDate,
}: {
  item: VaccineItem;
  completed: boolean;
  date: string;
  onToggle: () => void;
  onChangeDate: () => void;
}) {
  return (
    <View style={styles.vaccineTimelineCard}>
      <Text style={styles.vaccineCardTitle}>{item.title}</Text>
      <Text style={styles.vaccineCardMeta}>{completed ? `实际接种：${date}` : `预计接种：${item.planDate}`}</Text>
      <View style={styles.vaccineCardActions}>
        <Pressable accessibilityRole="button" accessibilityState={{ checked: completed }} onPress={onToggle} style={({ pressed }) => [styles.vaccineStatusButton, pressed && styles.pressed]}>
          <Text style={styles.vaccineStatusText}>{completed ? '已接种' : '未接种'}</Text>
          <VaccineRadio checked={completed} />
        </Pressable>
        {completed ? (
          <Pressable accessibilityRole="button" accessibilityLabel="修改接种日期" onPress={onChangeDate} hitSlop={10} style={({ pressed }) => [pressed && styles.pressed]}>
            <Text style={styles.vaccineChangeDateText}>修改时间</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function VaccineTimelineAxis({ age, variant }: { age: string; variant: 'start' | 'middle' | 'end' }) {
  return (
    <View style={styles.vaccineAgeRail}>
      <View style={styles.vaccineRailTopSlot}>
        {variant !== 'start' ? <View style={[styles.vaccineRailSegment, styles.vaccineRailTopSegment, variant === 'end' && styles.vaccineRailEndSegment]} /> : null}
      </View>
      <Text style={styles.vaccineAgeText}>{age}</Text>
      <View style={styles.vaccineAgeGap} />
      <View style={styles.vaccineRailDot} />
      <View style={styles.vaccineRailBottomSlot}>
        {variant !== 'end' ? <View style={styles.vaccineRailSegment} /> : null}
      </View>
    </View>
  );
}

function VaccineDateSheet({
  visible,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!visible) return null;

  const columns = [
    { label: '年', prev: '2025', current: '2026', next: '2027' },
    { label: '月', prev: '05', current: '06', next: '07' },
    { label: '日', prev: '15', current: '16', next: '17' },
  ];

  return (
    <View style={styles.vaccineModalLayer}>
      <Pressable accessibilityRole="button" accessibilityLabel="关闭日期选择" onPress={onCancel} style={styles.vaccineModalOverlay} />
      <View style={styles.vaccineDateSheet}>
        <Text style={styles.vaccineSheetTitle}>修改接种日期</Text>
        <View style={styles.vaccineDatePicker}>
          {columns.map((column) => (
            <View key={column.label} style={styles.vaccineDateColumn}>
              <Text style={styles.vaccineDateLabel}>{column.label}</Text>
              <Text style={styles.vaccineDateSide}>{column.prev}</Text>
              <View style={styles.vaccineDateSelected}>
                <Text style={styles.vaccineDateSelectedText}>{column.current}</Text>
              </View>
              <Text style={styles.vaccineDateSide}>{column.next}</Text>
            </View>
          ))}
        </View>
        <View style={styles.vaccineSheetActions}>
          <Pressable accessibilityRole="button" onPress={onCancel} style={({ pressed }) => [styles.vaccineCancelButton, pressed && styles.pressed]}>
            <Text style={styles.vaccineCancelText}>取消</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onConfirm} style={({ pressed }) => [styles.vaccineConfirmButton, pressed && styles.pressed]}>
            <Text style={styles.vaccineConfirmText}>确定</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function VaccineScreen({ onBack, onOpenNotice, notify }: { onBack: () => void; onOpenNotice: () => void; notify: (message: string) => void }) {
  const initialCompleted = vaccineTimeline.filter((item) => item.completed).map((item) => item.id);
  const [completedIds, setCompletedIds] = useState<string[]>(initialCompleted);
  const [dateById, setDateById] = useState<Record<string, string>>({ 'birth-hepb-1': '2026.05.16' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const toggleVaccine = (item: VaccineItem) => {
    setCompletedIds((current) => {
      if (current.includes(item.id)) return current.filter((id) => id !== item.id);
      return [...current, item.id];
    });
    if (!dateById[item.id]) {
      setDateById((current) => ({ ...current, [item.id]: '2026.06.16' }));
    }
  };

  const confirmDate = (date: Date) => {
    if (editingId) {
      setCompletedIds((current) => (current.includes(editingId) ? current : [...current, editingId]));
      setDateById((current) => ({ ...current, [editingId]: formatYmd(date) }));
      notify('接种日期已更新');
    }
    setEditingId(null);
  };

  const timelineGroups = vaccineTimeline.reduce<Array<{ age: string; items: VaccineItem[] }>>((groups, item) => {
    const latestGroup = groups[groups.length - 1];
    if (latestGroup?.age === item.age) {
      latestGroup.items.push(item);
      return groups;
    }
    groups.push({ age: item.age, items: [item] });
    return groups;
  }, []);

  return (
    <View style={styles.vaccinePage}>
      <ScrollView contentContainerStyle={styles.vaccineScrollContent} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="疫苗接种" onBack={onBack} />
        <VaccineReminderCard onPress={onOpenNotice} />
        <Text style={styles.vaccineSectionTitle}>免费疫苗时间轴</Text>

        <View style={styles.vaccineTimeline}>
          {timelineGroups.map((group, groupIndex) => {
            const variant = groupIndex === 0 ? 'start' : groupIndex === timelineGroups.length - 1 ? 'end' : 'middle';
            return (
              <View key={group.age} style={styles.vaccineTimelineRow}>
                <VaccineTimelineAxis age={group.age} variant={variant} />
                <View style={styles.vaccineCardStack}>
                  {group.items.map((item) => {
                    const completed = completedIds.includes(item.id);
                    const date = dateById[item.id] ?? item.actualDate ?? '2026.06.16';
                    return (
                      <VaccineCard
                        key={item.id}
                        item={item}
                        completed={completed}
                        date={date}
                        onToggle={() => toggleVaccine(item)}
                        onChangeDate={() => setEditingId(item.id)}
                      />
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>

        <Text style={styles.vaccineDisclaimer}>疫苗计划仅供记录和提醒，具体接种安排以当地接种门诊为准。</Text>
      </ScrollView>

      {editingId ? (
        <DateOnlyPickerSheet
          title="修改接种日期"
          value={parseYmd(dateById[editingId] ?? vaccineTimeline.find((item) => item.id === editingId)?.actualDate ?? '2026.06.16')}
          onCancel={() => setEditingId(null)}
          onConfirm={confirmDate}
        />
      ) : null}
    </View>
  );
}

function VaccineNoticeScreen({ onBack }: { onBack: () => void }) {
  const qas = [
    ['Q：接种前需要准备什么？', 'A：带好预防接种证，确认宝宝近期是否发热、腹泻或精神状态明显变差。如有异常，建议先咨询接种门诊。'],
    ['Q：接种后要观察什么？', 'A：接种后 24-48 小时内，可观察宝宝体温、精神状态、吃奶情况和接种部位是否红肿。'],
    ['Q：宝宝发热还能接种吗？', 'A：本产品不判断是否能接种。如宝宝发热或状态异常，建议咨询接种门诊。'],
  ];

  return (
    <ScrollView contentContainerStyle={styles.vaccineNoticeContent} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="疫苗须知" onBack={onBack} />
      {qas.map(([question, answer], index) => (
        <View key={question} style={[styles.vaccineQaCard, index === 0 ? styles.firstModuleSpacing : styles.stackedModuleSpacing]}>
          <Text style={styles.vaccineQuestion}>{question}</Text>
          <Text style={styles.vaccineAnswer}>{answer}</Text>
        </View>
      ))}
      <View style={[styles.vaccineRiskNotice, styles.stackedModuleSpacing]}>
        <Text style={styles.vaccineRiskText}>本内容仅用于接种前后照护参考，不替代医生或接种门诊建议。</Text>
      </View>
    </ScrollView>
  );
}

function HomeScreen({
  quickCardWidth,
  quickItems,
  babyProfile,
  articles,
  onQuickPress,
  onVaccinePress,
  onArticlePress,
  onOpenAllKnowledge,
  onRotateArticles,
}: {
  quickCardWidth: number;
  quickItems: QuickCareItem[];
  babyProfile: BabyProfile;
  articles: KnowledgeArticle[];
  onQuickPress: (item: QuickCareItem) => void;
  onVaccinePress: () => void;
  onArticlePress: (article: KnowledgeArticle) => void;
  onOpenAllKnowledge: () => void;
  onRotateArticles: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.homeScrollContent} showsVerticalScrollIndicator={false} bounces>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.greeting}>辛苦啦奶爸👋</Text>
          <Text style={styles.pageMeta}>{babyProfile.nickname}今天 {calculateBabyAgeText(babyProfile.birthDate)} 啦</Text>
        </View>
        <Image source={getBabyAvatarSource(babyProfile)} style={styles.avatar} resizeMode="cover" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>快捷记录</Text>
        <View style={styles.quickGrid}>
          {quickItems.map((item) => (
            <QuickCareCard key={item.id} item={item} width={quickCardWidth} onPress={() => onQuickPress(item)} />
          ))}
        </View>
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel="查看疫苗提醒" onPress={onVaccinePress} style={({ pressed }) => [styles.reminderCard, pressed && styles.pressed]}>
        <View style={styles.reminderBody}>
          <View style={styles.vaccineIcon}>
            <Image source={require('./assets/icon-vaccine.png')} style={styles.vaccineIconImage} resizeMode="contain" />
          </View>
          <View style={styles.reminderCopy}>
            <Text style={styles.listTitle}>疫苗提醒</Text>
            <Text style={styles.metaText}>乙肝疫苗第2剂 · 还有7天</Text>
          </View>
        </View>
        <Image source={require('./assets/icon-chevron.png')} style={styles.chevronImage} resizeMode="contain" />
      </Pressable>

      <View style={styles.knowledgeSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>知识推荐</Text>
          <Pressable accessibilityRole="button" onPress={onOpenAllKnowledge} hitSlop={10} style={styles.viewAll}>
            <Text style={styles.viewAllText}>查看全部</Text>
            <Image source={require('./assets/icon-chevron.png')} tintColor={colors.textSecondary} style={styles.viewAllChevron} resizeMode="contain" />
          </Pressable>
        </View>
        <View style={styles.articleList}>
          {articles.map((article) => <ArticleRow key={article.id} article={article} onPress={() => onArticlePress(article)} />)}
        </View>
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel="换一批知识推荐" onPress={onRotateArticles} hitSlop={10} style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}>
        <Text style={styles.refreshText}>换一批</Text>
        <Image source={require('./assets/icon-refresh.png')} style={styles.refreshIconImage} resizeMode="contain" />
      </Pressable>
    </ScrollView>
  );
}

export default function App() {
  const { width } = useWindowDimensions();
  const screenWidth = Math.min(width, 375);
  const contentWidth = screenWidth - spacing.page * 2;
  const quickCardWidth = (contentWidth - 11) / 2;
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeArticle[]>(() => loadMockKnowledgeArticles());
  const [babyProfile, setBabyProfile] = useState<BabyProfile>(() => loadMockBabyProfile());
  const [medicinePlans, setMedicinePlans] = useState<MedicinePlan[]>(() => loadMockMedicinePlans());
  const [profilePhotos, setProfilePhotos] = useState<ProfilePhotoRecord[]>(() => loadMockProfilePhotos());
  const [careRecords, setCareRecords] = useState<LogEntry[]>(() => loadMockCareRecords());
  const quickItems = useMemo(() => buildQuickCareItems(careRecords), [careRecords]);
  const [selectedNav, setSelectedNav] = useState('home');
  const [screen, setScreen] = useState<Screen>('splash');
  const [selectedLogEntry, setSelectedLogEntry] = useState<LogEntry>(defaultLogEntry);
  const [selectedProfilePhoto, setSelectedProfilePhoto] = useState<ProfilePhotoRecord | null>(null);
  const [editingLogEntry, setEditingLogEntry] = useState<LogEntry | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedKnowledgeArticle, setSelectedKnowledgeArticle] = useState<KnowledgeArticle>(knowledgeItems[0] ?? knowledgeArticles[0]!);
  const [knowledgeDetailFrom, setKnowledgeDetailFrom] = useState<KnowledgeDetailSource>('home');
  const [recordReturnScreen, setRecordReturnScreen] = useState<RecordReturnScreen>('home');
  const [toast, setToast] = useState<ToastState | null>(null);

  const shellStyle = useMemo(() => [styles.shell, Platform.OS === 'web' && { width: screenWidth }], [screenWidth]);

  const notify: Notify = (message, variant = 'normal') => {
    setToast({ message, variant });
    setTimeout(() => setToast(null), 1600);
  };

  const rotateArticles = () => {
    setKnowledgeItems((current) => {
      if (current.length < 2) return current;
      const [first, ...rest] = current;
      return [...rest, first!];
    });
    notify('已换一批内容');
  };

  const saveCareRecord = (record: CareRecordInput, message: string) => {
    const wasEditing = editingLogEntry;
    const nextRecord = createCareLogEntry(record);
    const recordToPersist = wasEditing ? { ...nextRecord, id: wasEditing.id } : nextRecord;
    setCareRecords((current) => {
      const next = (wasEditing
        ? current.map((item) => (item.id === wasEditing.id ? recordToPersist : item))
        : [recordToPersist, ...current]
      ).sort((a, b) => b.minutes - a.minutes);
      persistMockCareRecords(next);
      return next;
    });
    setSelectedLogEntry(recordToPersist);
    setEditingLogEntry(null);
    notify(wasEditing ? '记录已更新' : message);
    setScreen(wasEditing ? 'log-detail' : recordReturnScreen);
  };

  const saveBabyProfile = (profile: BabyProfile) => {
    setBabyProfile(profile);
    persistJsonToStorage(babyProfileStorageKey, profile);
    notify('宝宝档案已保存');
    setScreen('profile');
  };

  const updateMedicinePlans = (plans: MedicinePlan[]) => {
    setMedicinePlans(plans);
    persistJsonToStorage(medicinePlansStorageKey, plans);
  };

  const saveProfilePhotos = (photos: ProfilePhotoRecord[]) => {
    const sorted = [...photos].sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime());
    setProfilePhotos(sorted);
    persistJsonToStorage(profilePhotosStorageKey, sorted);
  };

  const addProfilePhotos = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      notify('当前演示环境暂不支持调用本地相册', 'critical');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files ?? []);
      if (!files.length) return;
      try {
        const nextPhotos = await Promise.all(files.map(readImageFileAsPhoto));
        saveProfilePhotos([...profilePhotos, ...nextPhotos]);
        notify(`已添加${nextPhotos.length}张照片`);
      } catch {
        notify('照片读取失败，请重新选择', 'critical');
      }
    };
    input.click();
  };

  const openRecordScreen = (target: Screen, returnTo: RecordReturnScreen) => {
    setEditingLogEntry(null);
    setRecordReturnScreen(returnTo);
    if (returnTo === 'log') {
      setSelectedNav('log');
    }
    setScreen(target);
  };

  const handleQuickPress = (item: QuickCareItem) => {
    if (item.id === 'feeding') {
      openRecordScreen('feeding-record', 'home');
      return;
    }
    if (item.id === 'diaper') {
      openRecordScreen('diaper-record', 'home');
      return;
    }
    if (item.id === 'medicine') {
      openRecordScreen('medicine-record', 'home');
      return;
    }
    if (item.id === 'sleep') {
      openRecordScreen('sleep-record', 'home');
      return;
    }
    notify(`${item.title}记录页下一步接入`);
  };

  const handleLogAddPress = (label: string) => {
    const targetByLabel: Record<string, Screen> = {
      喂食记录: 'feeding-record',
      睡眠记录: 'sleep-record',
      尿尿记录: 'diaper-record',
      屎尿记录: 'diaper-record',
      吃药记录: 'medicine-record',
    };
    const target = targetByLabel[label];
    if (target) {
      openRecordScreen(target, 'log');
    }
  };

  const handleNavSelect = (id: string, label: string) => {
    setSelectedNav(id);
    if (id === 'home') {
      setScreen('home');
      return;
    }
    if (id === 'log') {
      setScreen('log');
      return;
    }
    if (id === 'profile') {
      setScreen('profile');
      return;
    }
    notify(`${label}页面将在下一阶段接入`);
  };

  const cancelRecordScreen = () => {
    if (editingLogEntry) {
      setEditingLogEntry(null);
      setScreen('log-detail');
      return;
    }
    setScreen(recordReturnScreen);
  };

  const openEditLogEntry = (entry: LogEntry) => {
    setEditingLogEntry(entry);
    setRecordReturnScreen('log');
    setSelectedNav('log');
    setScreen(getRecordScreenForLogType(entry.type));
  };

  const deleteSelectedLogEntry = () => {
    const entryId = selectedLogEntry.id;
    setCareRecords((current) => {
      const next = current.filter((entry) => entry.id !== entryId);
      persistMockCareRecords(next);
      return next;
    });
    setDeleteConfirmOpen(false);
    setEditingLogEntry(null);
    setSelectedNav('log');
    setScreen('log');
    notify('记录已删除', 'critical');
  };

  const handleArticlePress = (article: KnowledgeArticle) => {
    setSelectedKnowledgeArticle(article);
    setKnowledgeDetailFrom('home');
    setScreen('knowledge-detail');
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <View style={shellStyle}>
        {screen !== 'splash' ? <WebStatusBar /> : null}

        {screen === 'splash' ? (
          <SplashScreen onDone={() => setScreen('onboarding')} />
        ) : null}

        {screen === 'onboarding' ? (
          <OnboardingScreen
            onDone={() => {
              setSelectedNav('home');
              setScreen('home');
            }}
          />
        ) : null}

        {screen === 'feeding-record' ? (
          <FeedingRecordScreen
            initialEntry={editingLogEntry}
            onBack={cancelRecordScreen}
            notify={notify}
            onSaved={(record) => saveCareRecord(record, '喂食记录已保存')}
          />
        ) : null}

        {screen === 'diaper-record' ? (
          <DiaperRecordScreen
            initialEntry={editingLogEntry}
            onBack={cancelRecordScreen}
            notify={notify}
            onSaved={(record) => saveCareRecord(record, '尿布记录已保存')}
          />
        ) : null}

        {screen === 'medicine-record' ? (
          <MedicineRecordScreen
            medicinePlans={medicinePlans}
            onMedicinePlansChange={updateMedicinePlans}
            initialEntry={editingLogEntry}
            onBack={cancelRecordScreen}
            notify={notify}
            onSaved={(record) => saveCareRecord(record, '吃药记录已保存')}
          />
        ) : null}

        {screen === 'sleep-record' ? (
          <SleepRecordScreen
            initialEntry={editingLogEntry}
            onBack={cancelRecordScreen}
            notify={notify}
            onSaved={(record) => saveCareRecord(record, '睡眠记录已保存')}
          />
        ) : null}

        {screen === 'log' ? (
          <LogScreen
            records={careRecords}
            onBack={() => {
              setSelectedNav('home');
              setScreen('home');
            }}
            onEntryPress={(entry) => {
              setSelectedLogEntry(entry);
              setScreen('log-detail');
            }}
            onAddPress={handleLogAddPress}
          />
        ) : null}

        {screen === 'log-detail' ? (
          <LogDetailScreen
            entry={selectedLogEntry}
            onBack={() => {
              setSelectedNav('log');
              setScreen('log');
            }}
            onEdit={() => openEditLogEntry(selectedLogEntry)}
            onDelete={() => setDeleteConfirmOpen(true)}
          />
        ) : null}

        {screen === 'profile' ? (
          <ProfileScreen
            profile={babyProfile}
            photos={profilePhotos}
            onBack={() => {
              setSelectedNav('home');
              setScreen('home');
            }}
            onEditProfile={() => setScreen('profile-edit')}
            onPhotoPress={(photo) => {
              setSelectedProfilePhoto(photo);
              setScreen('profile-photo');
            }}
            onAddPhoto={addProfilePhotos}
          />
        ) : null}

        {screen === 'profile-edit' ? (
          <ProfileEditScreen
            profile={babyProfile}
            onBack={() => setScreen('profile')}
            notify={notify}
            onSaved={saveBabyProfile}
          />
        ) : null}

        {screen === 'profile-photo' ? (
          <ProfilePhotoScreen
            photo={selectedProfilePhoto}
            onClose={() => setScreen('profile')}
            onAddPhoto={addProfilePhotos}
          />
        ) : null}

        {screen === 'knowledge' ? (
          <KnowledgeScreen
            articles={knowledgeItems}
            onBack={() => setScreen('home')}
            onOpenArticle={(article) => {
              setSelectedKnowledgeArticle(article);
              setKnowledgeDetailFrom('knowledge');
              setScreen('knowledge-detail');
            }}
          />
        ) : null}

        {screen === 'knowledge-detail' ? (
          <KnowledgeDetailScreen
            article={selectedKnowledgeArticle}
            onBack={() => setScreen(knowledgeDetailFrom)}
          />
        ) : null}

        {screen === 'vaccine' ? (
          <VaccineScreen
            onBack={() => setScreen('home')}
            onOpenNotice={() => setScreen('vaccine-notice')}
            notify={notify}
          />
        ) : null}

        {screen === 'vaccine-notice' ? (
          <VaccineNoticeScreen
            onBack={() => setScreen('vaccine')}
          />
        ) : null}

        {screen === 'home' ? (
          <HomeScreen
            quickCardWidth={quickCardWidth}
            quickItems={quickItems}
            babyProfile={babyProfile}
            articles={knowledgeItems.slice(0, 3)}
            onQuickPress={handleQuickPress}
            onVaccinePress={() => setScreen('vaccine')}
            onArticlePress={handleArticlePress}
            onOpenAllKnowledge={() => setScreen('knowledge')}
            onRotateArticles={rotateArticles}
          />
        ) : null}

        {screen === 'home' || screen === 'log' || screen === 'profile' ? <BottomNavigation selected={selectedNav} onSelect={handleNavSelect} /> : null}

        {toast ? (
          <View style={[styles.toast, toast.variant === 'critical' && styles.toastCritical]}>
            {toast.variant === 'critical' ? (
              <View style={styles.toastIcon}>
                <Text style={styles.toastIconText}>!</Text>
              </View>
            ) : null}
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
        ) : null}

        {deleteConfirmOpen ? <ConfirmDeleteSheet onCancel={() => setDeleteConfirmOpen(false)} onConfirm={deleteSelectedLogEntry} /> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Platform.OS === 'web' ? '#E7EAEE' : colors.background,
  },
  webNoFocus: Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {},
  firstModuleSpacing: {
    marginTop: 20,
  },
  stackedModuleSpacing: {
    marginTop: 12,
  },
  shell: {
    flex: 1,
    maxWidth: 375,
    width: '100%',
    backgroundColor: colors.background,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { minHeight: 812, borderRadius: 26 } : null),
  },
  webStatusBar: {
    width: '100%',
    height: 44,
  },
  splashScreen: {
    flex: 1,
    backgroundColor: '#F7FCFF',
  },
  splashImage: {
    width: '100%',
    height: '100%',
  },
  splashVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  emptyState: {
    minHeight: 238,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyStateCompact: {
    minHeight: 154,
    paddingVertical: 8,
  },
  emptyStateImage: {
    width: 136,
    height: 136,
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 17,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  onboardingPage: {
    flex: 1,
    backgroundColor: colors.background,
  },
  onboardingHeader: {
    height: 44,
    paddingHorizontal: spacing.page,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  onboardingProgress: {
    minWidth: 55,
    height: 29,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sleep,
  },
  onboardingProgressText: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400',
    color: colors.actionPrimary,
  },
  onboardingBody: {
    flex: 1,
    paddingHorizontal: spacing.page,
    paddingTop: 20,
  },
  onboardingQuestion: {
    width: '100%',
    gap: 6,
  },
  onboardingQuestionCenter: {
    alignItems: 'center',
  },
  onboardingTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  onboardingTitleCenter: {
    textAlign: 'center',
  },
  onboardingSubtitle: {
    fontSize: 13,
    lineHeight: 19.5,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  onboardingSubtitleCenter: {
    textAlign: 'center',
  },
  onboardingInputStage: {
    marginTop: 105,
    alignItems: 'center',
  },
  onboardingNicknameImage: {
    position: 'absolute',
    left: 110,
    top: 122,
    width: 155.5,
    height: 155.5,
    zIndex: 2,
  },
  onboardingInputCard: {
    width: '100%',
    minHeight: 67,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: '#F8FAFC',
  },
  onboardingInputLabel: {
    fontSize: 11,
    lineHeight: 14.3,
    fontWeight: '400',
    color: colors.textPrimary,
  },
  onboardingTextInput: {
    padding: 0,
    margin: 0,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '400',
    color: colors.textPrimary,
  },
  onboardingDateStage: {
    marginTop: 102,
    alignItems: 'center',
  },
  onboardingBirthImage: {
    position: 'absolute',
    left: 135,
    top: 129,
    width: 106,
    height: 106,
    zIndex: 2,
  },
  onboardingDateCard: {
    width: '100%',
    height: 180,
    borderRadius: 17,
    padding: 12,
    flexDirection: 'row',
    gap: 9,
    backgroundColor: colors.surface,
  },
  onboardingDateColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  onboardingDateLabel: {
    fontSize: 11,
    lineHeight: 14.3,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  onboardingDateMuted: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '400',
    color: colors.textSecondary,
    opacity: 0.45,
  },
  onboardingDateSelected: {
    width: 90,
    height: 47,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECEAFF',
  },
  onboardingDateSelectedText: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  onboardingOptionStage: {
    marginTop: 102,
  },
  onboardingFeedingImage: {
    position: 'absolute',
    left: 49.5,
    top: 111,
    width: 114,
    height: 114,
    zIndex: 2,
  },
  onboardingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 9,
    rowGap: 9,
  },
  onboardingOption: {
    width: 159,
    height: 70,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  onboardingOptionWide: {
    width: '100%',
  },
  onboardingOptionActive: {
    backgroundColor: '#ECEAFF',
    borderColor: colors.actionPrimary,
  },
  onboardingOptionText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    color: colors.textPrimary,
  },
  onboardingOptionTextActive: {
    fontWeight: '600',
    color: colors.actionPrimary,
  },
  onboardingGenderStage: {
    marginTop: 102,
  },
  onboardingGenderRow: {
    flexDirection: 'row',
    gap: 9,
  },
  onboardingBoyImage: {
    position: 'absolute',
    left: 24.5,
    top: 138,
    width: 94.5,
    height: 94.5,
    zIndex: 2,
  },
  onboardingGirlImage: {
    position: 'absolute',
    left: 256.5,
    top: 138,
    width: 94.5,
    height: 94.5,
    zIndex: 2,
  },
  onboardingMedicineStage: {
    marginTop: 104,
  },
  onboardingMedicineImage: {
    position: 'absolute',
    left: 140.5,
    top: 138,
    width: 94.5,
    height: 94.5,
    zIndex: 2,
  },
  onboardingMedicineOptions: {
    gap: 9,
  },
  onboardingCompleteStage: {
    marginTop: 0,
    height: 310,
    position: 'relative',
    alignItems: 'center',
  },
  onboardingCompleteImage: {
    position: 'absolute',
    left: 24,
    top: 123,
    width: 327,
    height: 327,
    zIndex: 2,
  },
  onboardingStar: {
    position: 'absolute',
    zIndex: 3,
  },
  onboardingStarOne: {
    left: 83.5,
    top: 205,
    width: 26,
    height: 26,
    transform: [{ rotate: '-24deg' }],
  },
  onboardingStarTwo: {
    left: 261,
    top: 166,
    width: 20,
    height: 20,
    transform: [{ rotate: '-13deg' }],
  },
  onboardingStarThree: {
    left: 271,
    top: 192,
    width: 31,
    height: 31,
    transform: [{ rotate: '23deg' }],
  },
  onboardingStarFour: {
    left: 238,
    top: 398,
    width: 36,
    height: 36,
    transform: [{ rotate: '-1deg' }],
  },
  onboardingActions: {
    position: 'absolute',
    left: spacing.page,
    right: spacing.page,
    bottom: 25,
    flexDirection: 'row',
    gap: 9,
  },
  onboardingPrimaryButton: {
    flex: 1,
    height: 42,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.actionPrimary,
  },
  onboardingPrimaryButtonWithSecondary: {
    flex: 1,
  },
  onboardingPrimaryButtonDisabled: {
    opacity: 0.5,
  },
  onboardingPrimaryButtonText: {
    fontSize: 16,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.surface,
  },
  onboardingSecondaryButton: {
    flex: 1,
    height: 42,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  onboardingSecondaryButtonText: {
    fontSize: 16,
    lineHeight: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  knowledgeScrollContent: {
    paddingHorizontal: spacing.page,
    paddingTop: 7.5,
    paddingBottom: 48,
  },
  knowledgeSearch: {
    height: 42,
    marginTop: 20,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '400',
    color: colors.textPrimary,
  },
  knowledgeTabs: {
    marginTop: 12,
    height: 30,
    flexDirection: 'row',
    gap: 6,
  },
  knowledgeTab: {
    flex: 1,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  knowledgeTabActive: {
    backgroundColor: '#212129',
  },
  knowledgeTabText: {
    fontSize: 13,
    lineHeight: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  knowledgeTabTextActive: {
    color: colors.surface,
  },
  knowledgeList: {
    marginTop: 10,
    gap: 10,
  },
  knowledgeEmptyText: {
    paddingVertical: 24,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  knowledgeCard: {
    height: 95,
    borderRadius: 12,
    padding: 9,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  knowledgeCardImage: {
    width: 77,
    height: 77,
    borderRadius: 6,
  },
  knowledgeCardContent: {
    flex: 1,
    height: 77,
    gap: 4,
    overflow: 'hidden',
  },
  knowledgeCategory: {
    fontSize: 11,
    lineHeight: 14.3,
    fontWeight: '400',
    color: '#45556C',
  },
  knowledgeCardTitle: {
    fontSize: 13,
    lineHeight: 19.5,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  knowledgeCardSummary: {
    fontSize: 11,
    lineHeight: 14.3,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  knowledgeCardMeta: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  knowledgeDetailPage: {
    flex: 1,
    backgroundColor: colors.background,
  },
  knowledgeDetailScroll: {
    flex: 1,
  },
  knowledgeDetailContent: {
    paddingBottom: 28,
    paddingTop: 0,
  },
  knowledgeHero: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 209,
    overflow: 'hidden',
  },
  knowledgeHeroImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    width: '100%',
    height: 209,
  },
  knowledgeHeroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 256,
    backgroundColor: 'rgba(34,34,41,0.26)',
  },
  knowledgeDetailHeader: {
    position: 'absolute',
    top: 7.5,
    left: 0,
    right: 0,
    height: 44,
    paddingLeft: spacing.page,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    zIndex: 20,
  },
  knowledgeDetailNavTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  knowledgeTitleCard: {
    marginHorizontal: spacing.page,
    marginTop: 182.5,
    borderRadius: 17,
    padding: 12,
    backgroundColor: colors.surface,
    zIndex: 3,
  },
  knowledgeDetailTitle: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  knowledgeDetailTags: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  knowledgeDetailTag: {
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  knowledgeDetailTagText: {
    fontSize: 11,
    lineHeight: 14.3,
    fontWeight: '500',
    color: '#45556C',
  },
  knowledgeDetailMetaRow: {
    marginTop: 10,
    paddingTop: 11,
    paddingLeft: 5,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  knowledgeDetailMetaText: {
    fontSize: 11,
    lineHeight: 16.5,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  knowledgeDetailDivider: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
    color: '#CAD5E2',
  },
  knowledgeConclusionCard: {
    marginHorizontal: spacing.page,
    marginTop: 20,
    borderRadius: 17,
    padding: 12,
    gap: 10,
    backgroundColor: colors.surface,
  },
  knowledgeDetailSectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  knowledgeDetailIconImage: {
    width: 30,
    height: 30,
  },
  knowledgeDetailIconImageLarge: {
    width: 38,
    height: 38,
  },
  knowledgeDetailSectionTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  knowledgeParagraph: {
    paddingLeft: 40,
    fontSize: 13,
    lineHeight: 19.5,
    fontWeight: '400',
    color: '#727272',
  },
  knowledgeStrong: {
    color: colors.textPrimary,
  },
  knowledgeDadCard: {
    marginHorizontal: spacing.page,
    marginTop: 20,
    borderRadius: 17,
    padding: 12,
    gap: 10,
    backgroundColor: '#D5E6FF',
  },
  knowledgeDadStep: {
    height: 40,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  knowledgeStepNumber: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F39F6',
  },
  knowledgeStepNumberText: {
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '700',
    color: colors.surface,
  },
  knowledgeDadText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19.5,
    fontWeight: '400',
    color: colors.textPrimary,
  },
  knowledgeStepsCard: {
    marginHorizontal: spacing.page,
    marginTop: 20,
    borderRadius: 17,
    padding: 12,
    gap: 10,
    backgroundColor: colors.surface,
  },
  knowledgeStepsList: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 12,
  },
  knowledgeStepLine: {
    fontSize: 13,
    lineHeight: 19.5,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  knowledgeStepBold: {
    fontWeight: '500',
    color: colors.textPrimary,
  },
  knowledgeObserveBlock: {
    marginTop: 1,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    gap: 10,
  },
  knowledgeObserveTitle: {
    paddingHorizontal: 4,
    fontSize: 13,
    lineHeight: 19.5,
    fontWeight: '600',
    color: '#0F172B',
  },
  knowledgeObserveTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  knowledgeDoctorCard: {
    marginHorizontal: spacing.page,
    marginTop: 20,
    borderRadius: 17,
    padding: 12,
    gap: 10,
    backgroundColor: '#FFEBD1',
  },
  knowledgeDoctorText: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 13,
    lineHeight: 19.5,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  knowledgeWarning: {
    color: '#F54900',
  },
  homeScrollContent: {
    paddingHorizontal: spacing.page,
    paddingTop: Platform.OS === 'web' ? 10 : 10,
    paddingBottom: 124,
  },
  header: {
    height: 53.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: 2.5,
  },
  greeting: {
    ...typography.greeting,
    color: colors.textPrimary,
    letterSpacing: 0.25,
  },
  pageMeta: {
    ...typography.pageMeta,
    color: colors.textSecondary,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  section: {
    marginTop: spacing.xxl,
    gap: spacing.lg,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 11,
    rowGap: 12,
  },
  quickCard: {
    height: 123,
    borderRadius: radius.card,
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  quickIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.iconOverlay,
  },
  quickIconImage: {
    width: 18,
    height: 18,
  },
  quickCopy: {
    gap: 0,
  },
  quickTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  quickMetaRow: {
    minHeight: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickMeta: {
    ...typography.meta,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  addButton: {
    width: 23,
    height: 23,
    borderRadius: 11.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  addIconImage: {
    width: 12,
    height: 12,
  },
  reminderCard: {
    height: 60,
    marginTop: spacing.xxl,
    padding: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  vaccineIcon: {
    width: 31,
    height: 31,
    borderRadius: 15.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.vaccine,
  },
  vaccineIconImage: {
    width: 14,
    height: 14,
  },
  reminderCopy: {
    gap: spacing.xxs,
  },
  listTitle: {
    ...typography.listTitle,
    color: colors.textPrimary,
  },
  metaText: {
    ...typography.meta,
    color: colors.textSecondary,
  },
  knowledgeSection: {
    marginTop: spacing.page,
    gap: spacing.lg,
  },
  sectionHeader: {
    height: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  viewAllText: {
    ...typography.pageMeta,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  viewAllChevron: {
    width: 13,
    height: 13,
  },
  articleList: {
    gap: spacing.md,
  },
  articleRow: {
    height: 60,
    padding: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  articleImage: {
    width: 36,
    height: 36,
    borderRadius: radius.image,
  },
  articleCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  chevronImage: {
    width: 18,
    height: 18,
  },
  refreshButton: {
    alignSelf: 'center',
    marginTop: 15,
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  refreshText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  refreshIconImage: {
    width: 18,
    height: 18,
  },
  recordScrollContent: {
    paddingHorizontal: spacing.page,
    paddingTop: 7.5,
    paddingBottom: 210,
  },
  recordNav: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  backCircle: {
    width: 29,
    height: 29,
    borderRadius: 14.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  backIcon: {
    width: 15,
    height: 15,
    transform: [{ rotate: '180deg' }],
  },
  recordTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  segmentedControl: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 9,
  },
  segmentPill: {
    flex: 1,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  segmentPillActive: {
    backgroundColor: '#212129',
  },
  segmentText: {
    fontSize: 13,
    lineHeight: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.surface,
  },
  recordForm: {
    marginTop: 21,
    gap: 10,
  },
  formRow: {
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  formLabelWrap: {
    width: 130,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  formLabel: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  requiredMark: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
    color: '#FF383C',
  },
  formValue: {
    flex: 1,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  formValueStrong: {
    color: colors.textPrimary,
  },
  formInlineInput: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    margin: 0,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '400',
    color: colors.textPrimary,
    textAlign: 'left',
  },
  rowChevron: {
    width: 15,
    height: 15,
  },
  miniSegment: {
    height: 29,
    padding: 3,
    borderRadius: 999,
    backgroundColor: '#F8F9FB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniSegmentItem: {
    flex: 1,
    height: 23,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FB',
  },
  miniSegmentItemActive: {
    backgroundColor: '#111111',
  },
  miniSegmentText: {
    fontSize: 11,
    lineHeight: 13.5,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  miniSegmentTextActive: {
    color: colors.surface,
  },
  methodSegment: {
    width: 125,
  },
  sideSegment: {
    width: 92,
    height: 27,
    padding: 0,
    gap: 5,
    backgroundColor: colors.surface,
  },
  breastCard: {
    minHeight: 273,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 20,
    backgroundColor: colors.surface,
  },
  breastHeader: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerGrid: {
    marginTop: 11,
    flexDirection: 'row',
    gap: 9,
  },
  timerPanel: {
    flex: 1,
    height: 147,
    borderRadius: 12,
    alignItems: 'center',
    paddingTop: 12,
  },
  timerPanelActive: {
    backgroundColor: '#F3F0FF',
  },
  timerPanelIdle: {
    backgroundColor: '#F8F9FB',
  },
  timerSide: {
    fontSize: 13,
    lineHeight: 15.5,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  timerTime: {
    marginTop: 7,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  timerStatus: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 13.5,
    fontWeight: '500',
  },
  timerStatusActive: {
    color: colors.actionPrimary,
  },
  timerStatusIdle: {
    color: colors.textSecondary,
  },
  timerButton: {
    marginTop: 13,
    width: 87,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerButtonActive: {
    backgroundColor: colors.actionPrimary,
  },
  timerButtonIdle: {
    borderWidth: 0.5,
    borderColor: '#E0E0E8',
    backgroundColor: colors.surface,
  },
  timerButtonText: {
    fontSize: 11,
    lineHeight: 13.5,
    fontWeight: '600',
  },
  timerButtonTextActive: {
    color: colors.surface,
  },
  timerButtonTextIdle: {
    color: colors.textPrimary,
  },
  manualDurationPicker: {
    marginTop: 10,
    alignItems: 'center',
    gap: 4,
  },
  manualDurationSmall: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '600',
    color: 'rgba(34, 34, 41, 0.46)',
  },
  manualDurationMedium: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: 'rgba(34, 34, 41, 0.66)',
  },
  manualDurationSelected: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  lastSideRow: {
    height: 46,
    marginTop: 12,
    borderRadius: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastSideLabel: {
    fontSize: 13,
    lineHeight: 15.5,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  amountCard: {
    minHeight: 273,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 14,
    backgroundColor: colors.surface,
  },
  amountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  milkAmountInputWrap: {
    flex: 1,
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
  },
  milkAmountInput: {
    minWidth: 56,
    padding: 0,
    margin: 0,
    textAlign: 'right',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  milkAmountUnit: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  bottlePicker: {
    height: 228,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottleImage: {
    position: 'absolute',
    width: 232,
    height: 300,
  },
  milkScale: {
    marginTop: 58,
    width: 70,
    alignItems: 'center',
    gap: 7,
  },
  milkScaleSmall: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
    color: 'rgba(34, 34, 41, 0.6)',
  },
  milkScaleMedium: {
    fontSize: 15,
    lineHeight: 19.5,
    fontWeight: '600',
    color: 'rgba(34, 34, 41, 0.8)',
  },
  milkScaleSelected: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: '#000000',
  },
  diaperPage: {
    flex: 1,
    backgroundColor: colors.background,
  },
  diaperScrollContent: {
    paddingHorizontal: spacing.page,
    paddingTop: 7.5,
    paddingBottom: 126,
  },
  diaperContent: {
    marginTop: 20,
    gap: 20,
  },
  diaperSection: {
    gap: 10,
  },
  diaperSectionTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  diaperChoiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 9,
    rowGap: 6,
  },
  diaperChoice: {
    width: 97,
    height: 48,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  diaperChoiceSelected: {
    borderWidth: 1,
    borderColor: colors.actionPrimary,
    backgroundColor: '#ECEAFF',
  },
  diaperChoiceText: {
    fontSize: 13,
    lineHeight: 19.5,
    fontWeight: '400',
    color: colors.textPrimary,
  },
  diaperChoiceTextSelected: {
    lineHeight: 13,
    fontWeight: '600',
    color: colors.actionPrimary,
  },
  diaperRows: {
    gap: 10,
  },
  diaperToggleRow: {
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  diaperRowLabel: {
    width: 130,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  diaperToggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  diaperToggleOption: {
    minWidth: 36,
    height: 30,
    borderRadius: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  diaperToggleOptionSelected: {
    borderWidth: 1,
    borderColor: colors.actionPrimary,
    backgroundColor: '#ECEAFF',
  },
  diaperToggleText: {
    fontSize: 13,
    lineHeight: 19.5,
    color: colors.textPrimary,
  },
  diaperToggleTextSelected: {
    lineHeight: 13,
    fontWeight: '500',
    color: colors.actionPrimary,
  },
  diaperPhotoRow: {
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  diaperPhotoLabel: {
    width: 130,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  diaperPhotoHint: {
    flex: 1,
    fontSize: 13,
    lineHeight: 17,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  diaperAddPhotoButton: {
    height: 24,
    borderRadius: 6,
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECEAFF',
  },
  diaperAddPhotoButtonCompact: {
    width: 52,
    paddingHorizontal: 0,
  },
  diaperAddPhotoText: {
    fontSize: 13,
    lineHeight: 13,
    fontWeight: '500',
    color: colors.actionPrimary,
  },
  diaperPhotoCard: {
    minHeight: 117,
    borderRadius: 12,
    padding: 12,
    gap: 9,
    backgroundColor: colors.surface,
  },
  diaperPhotoHeader: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  diaperPhotoTitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  diaperThumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  diaperThumbWrap: {
    width: 60.5,
    height: 60.5,
    borderRadius: 6,
    overflow: 'hidden',
  },
  diaperThumb: {
    width: '100%',
    height: '100%',
  },
  diaperThumbClose: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderBottomLeftRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 34, 41, 0.88)',
  },
  diaperThumbCloseText: {
    marginTop: -1,
    fontSize: 18,
    lineHeight: 18,
    color: colors.surface,
  },
  sleepSegmentedControl: {
    marginTop: 20,
  },
  sleepCenterStage: {
    marginTop: 89,
    alignItems: 'center',
  },
  sleepCenterStageWithDetails: {
    marginTop: 89,
  },
  sleepCircleButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECE9FF',
  },
  sleepCircleButtonActive: {
    backgroundColor: '#7668F3',
  },
  sleepIcon: {
    width: 32,
    height: 32,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sleepPlayIcon: {
    width: 0,
    height: 0,
    marginLeft: 4,
    borderTopWidth: 9,
    borderBottomWidth: 9,
    borderLeftWidth: 14,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.actionPrimary,
  },
  sleepPauseIcon: {
    width: 22,
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  sleepPauseBar: {
    width: 3.5,
    height: 22,
    borderRadius: 2,
    backgroundColor: colors.surface,
  },
  sleepCircleText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sleepCircleTextActive: {
    color: colors.surface,
  },
  sleepElapsedBlock: {
    marginTop: 13,
    alignItems: 'center',
  },
  sleepElapsedLabel: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  sleepElapsedTime: {
    marginTop: 5,
    fontSize: 29,
    lineHeight: 36,
    fontWeight: '500',
    color: '#000000',
  },
  sleepRecordRows: {
    marginTop: 35,
    gap: 10,
  },
  sleepManualRows: {
    marginTop: 20,
    gap: 10,
  },
  medicineScrollContent: {
    paddingHorizontal: spacing.page,
    paddingTop: 7.5,
    paddingBottom: 126,
    gap: 10,
  },
  medicineSectionTitle: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  medicineSectionHeader: {
    marginTop: 10,
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  medicineSectionTitleNoMargin: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  medicineNewButton: {
    minWidth: 58,
    height: 24,
    borderRadius: 6,
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECEAFF',
  },
  medicineNewButtonText: {
    fontSize: 13,
    lineHeight: 13,
    fontWeight: '500',
    color: colors.actionPrimary,
  },
  medicineEmptyText: {
    fontSize: 13,
    lineHeight: 19.5,
    color: colors.textSecondary,
  },
  medicineEntryCard: {
    borderRadius: 12,
    padding: 12,
    gap: 10,
    backgroundColor: colors.surface,
  },
  medicineEntryHeader: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  medicineEntryTitle: {
    fontSize: 13,
    lineHeight: 19.5,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  secondaryButton: {
    height: 24,
    paddingHorizontal: 9,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#CACFD7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  secondaryButtonText: {
    fontSize: 13,
    lineHeight: 13,
    fontWeight: '400',
    color: '#727272',
  },
  pillActionButton: {
    minWidth: 44,
    height: 24,
    borderRadius: 6,
    paddingHorizontal: 9,
    borderWidth: 0.5,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: '#F2F0FF',
  },
  pillActionButtonOutline: {
    borderColor: '#CACFD7',
    backgroundColor: colors.surface,
  },
  pillActionText: {
    fontSize: 13,
    lineHeight: 13,
    fontWeight: '400',
    color: colors.actionPrimary,
  },
  pillActionTextOutline: {
    color: '#727272',
  },
  pillActionIcon: {
    width: 12,
    height: 12,
  },
  medicineInputRow: {
    minHeight: 44,
    borderRadius: 6,
    paddingHorizontal: 10,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  medicinePlaceholder: {
    fontSize: 11,
    lineHeight: 14.3,
    color: colors.textSecondary,
  },
  medicineNameInput: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    margin: 0,
    fontSize: 11,
    lineHeight: 14.3,
    color: colors.textPrimary,
  },
  medicineDoseField: {
    width: 74,
    minHeight: 32,
    justifyContent: 'center',
  },
  medicineEntryRows: {
    gap: 8,
  },
  medicineRowName: {
    color: colors.textPrimary,
  },
  medicineInputDivider: {
    width: 0.5,
    height: 14,
    backgroundColor: colors.textSecondary,
  },
  clearDotButton: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
    textAlign: 'center',
    lineHeight: 14,
    fontSize: 10,
    fontWeight: '700',
    color: colors.surface,
    backgroundColor: colors.textSecondary,
  },
  selectedMedicineBox: {
    borderRadius: 12,
    paddingVertical: 8,
    gap: 3,
    backgroundColor: colors.surface,
  },
  selectedMedicineName: {
    fontSize: 13,
    lineHeight: 19.5,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  selectedMedicineDose: {
    fontSize: 13,
    lineHeight: 17,
    color: colors.actionPrimary,
  },
  drugChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  drugChip: {
    minHeight: 26,
    paddingHorizontal: 9,
    borderRadius: 6,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  drugChipSelected: {
    backgroundColor: '#F1F5F9',
  },
  drugChipText: {
    fontSize: 11,
    lineHeight: 14.3,
    color: '#45556C',
  },
  drugChipPlus: {
    fontSize: 15,
    lineHeight: 17,
    color: '#45556C',
  },
  currentMedicineHint: {
    minHeight: 24,
    justifyContent: 'center',
  },
  currentMedicineHintText: {
    fontSize: 11,
    lineHeight: 14.3,
    color: colors.textSecondary,
  },
  medicineListCard: {
    minHeight: 64,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  medicineCardCopy: {
    flex: 1,
    gap: 6,
  },
  medicineCardTitle: {
    fontSize: 13,
    lineHeight: 19.5,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  medicineCardMeta: {
    fontSize: 11,
    lineHeight: 14.3,
    color: colors.textSecondary,
  },
  takenAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  takenActionText: {
    fontSize: 13,
    lineHeight: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.2,
    borderColor: '#8B8B94',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkCircleActive: {
    borderColor: colors.actionPrimary,
    backgroundColor: colors.actionPrimary,
  },
  checkMark: {
    color: colors.surface,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
  },
  myMedicineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  disclaimer: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 14.3,
    color: colors.textSecondary,
  },
  logScrollContent: {
    paddingHorizontal: spacing.page,
    paddingTop: 7.5,
    paddingBottom: 190,
  },
  logDateStrip: {
    paddingTop: 20,
    paddingBottom: 20,
    gap: 9,
  },
  logDatePill: {
    width: 38,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.surface,
  },
  logDatePillActive: {
    backgroundColor: '#222229',
  },
  logDateWeek: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  logDateWeekActive: {
    color: colors.surface,
  },
  logDateDay: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  logDateDayActive: {
    color: colors.surface,
  },
  logSummaryCard: {
    minHeight: 151,
    borderRadius: 17,
    padding: 12,
    backgroundColor: colors.surface,
  },
  logDateTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  logSummaryGrid: {
    marginTop: 13,
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 9,
    rowGap: 9,
  },
  logSummaryItem: {
    width: 147,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#F4F6F3',
  },
  logSummaryText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '400',
    color: colors.textPrimary,
  },
  logIconBubble: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logTimelineHeader: {
    marginTop: 20,
    height: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logTimelineTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  logFilterButton: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  logFilterIcon: {
    transform: [{ rotate: '90deg' }],
    fontSize: 18,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  logTimeline: {
    marginTop: 0,
  },
  logEmptyText: {
    paddingVertical: 28,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  logTimelineRow: {
    height: 66,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logTimeRail: {
    width: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logTimeText: {
    width: 42,
    textAlign: 'right',
    fontSize: 11,
    lineHeight: 12,
    fontWeight: '500',
    color: '#45556C',
  },
  logRailAxis: {
    width: 18,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logRailTopSlot: {
    position: 'absolute',
    top: 0,
    height: 28.5,
    alignItems: 'center',
  },
  logRailBottomSlot: {
    position: 'absolute',
    top: 37.5,
    height: 28.5,
    alignItems: 'center',
  },
  logTimeDot: {
    position: 'absolute',
    top: 28.5,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1.5,
    borderColor: '#B5B7BE',
    backgroundColor: colors.background,
    zIndex: 2,
  },
  logTimeLine: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(139, 139, 148, 0.5)',
  },
  logTimelineCard: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: colors.surface,
  },
  logTimelineCopy: {
    gap: 4,
  },
  logTimelineCardTitle: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  logTimelineCardMeta: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  logFab: {
    position: 'absolute',
    right: 24,
    bottom: 97,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.actionPrimary,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 9px 17px rgba(100, 90, 229, 0.28)' }
      : {
          shadowColor: colors.actionPrimary,
          shadowOffset: { width: 0, height: 9 },
          shadowOpacity: 0.28,
          shadowRadius: 17,
        }),
    elevation: 10,
    zIndex: 12,
  },
  logFabText: {
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '300',
    color: colors.surface,
  },
  logAddSheet: {
    minHeight: 260,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 34,
    backgroundColor: colors.surface,
  },
  logAddGrid: {
    marginTop: 16,
    gap: 10,
  },
  logAddItem: {
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logAddItemText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  logAddItemPlus: {
    fontSize: 18,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.actionPrimary,
  },
  logDetailScrollContent: {
    paddingHorizontal: spacing.page,
    paddingTop: 7.5,
    paddingBottom: 190,
  },
  logDetailHero: {
    height: 50,
    marginTop: 20,
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: colors.surface,
  },
  logDetailHeroCopy: {
    gap: 4,
  },
  logDetailHeroTitle: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  logDetailHeroMeta: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  logDetailRows: {
    marginTop: 10,
    gap: 10,
  },
  logDetailRow: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  logDetailLabel: {
    width: 138,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  logDetailValue: {
    flex: 1,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '400',
    color: colors.textPrimary,
  },
  logDetailActions: {
    position: 'absolute',
    left: spacing.page,
    right: spacing.page,
    bottom: 28,
    gap: 10,
  },
  logEditButton: {
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.actionPrimary,
  },
  logEditText: {
    fontSize: 16,
    lineHeight: 16,
    fontWeight: '700',
    color: colors.surface,
  },
  logDeleteButton: {
    height: 42,
    borderRadius: 15,
    borderWidth: 0.5,
    borderColor: '#FF383C',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  logDeleteText: {
    fontSize: 16,
    lineHeight: 16,
    fontWeight: '700',
    color: '#FF383C',
  },
  profileScrollContent: {
    paddingHorizontal: spacing.page,
    paddingTop: 7.5,
    paddingBottom: 128,
  },
  profileArchiveCard: {
    height: 188,
    marginTop: 20,
    borderRadius: 17,
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#DCEAFF',
    ...(Platform.OS === 'web' ? ({ backgroundImage: 'linear-gradient(180deg, #DCEEFF 0%, #F1EAF8 100%)' } as any) : null),
  },
  profileArchiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileArchiveTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  profileArchiveEdit: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  profileAvatarLarge: {
    alignSelf: 'center',
    marginTop: 14,
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  profileAge: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  profileStats: {
    marginTop: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileStatItem: {
    minWidth: 58,
    alignItems: 'center',
    gap: 4,
  },
  profileStatLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '300',
    color: colors.textSecondary,
  },
  profileStatValue: {
    fontSize: 13,
    lineHeight: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  profilePhotoTitle: {
    marginTop: 20,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  profilePhotoDate: {
    marginTop: 20,
    marginBottom: 12.5,
    fontSize: 11,
    lineHeight: 16.5,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  profilePhotoGroup: {
    marginTop: 0,
  },
  profilePhotoGridToday: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  profilePhotoThumbSmall: {
    width: 105.5,
    height: 105.5,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  profilePhotoGridYesterday: {
    flexDirection: 'row',
    gap: 5,
  },
  profilePhotoThumbLarge: {
    width: 161,
    height: 161,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  profileFab: {
    bottom: 123,
  },
  profilePhotoImage: {
    width: '100%',
    height: '100%',
  },
  profileEditScrollContent: {
    paddingHorizontal: spacing.page,
    paddingTop: 7.5,
    paddingBottom: 104,
  },
  profileEditAvatarCard: {
    minHeight: 94,
    marginTop: 20,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
  },
  profileEditAvatarWrap: {
    width: 62,
    height: 62,
  },
  profileEditAvatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  profileEditCameraBadge: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.actionPrimary,
  },
  profileEditCameraText: {
    marginTop: -1,
    fontSize: 14,
    lineHeight: 14,
    fontWeight: '700',
    color: colors.surface,
  },
  profileEditAvatarCopy: {
    flex: 1,
    marginLeft: 14,
    gap: 4,
  },
  profileEditAvatarTitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  profileEditAvatarHint: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  profileEditAvatarChevron: {
    fontSize: 24,
    lineHeight: 24,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  profileEditRows: {
    marginTop: 10,
    gap: 10,
  },
  profileEditRow: {
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileEditLabel: {
    width: 138,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  profileChoiceGroup: {
    flexDirection: 'row',
    gap: 9,
  },
  profileChoiceGroupSmall: {
    flexDirection: 'row',
    gap: 9,
  },
  profileChoice: {
    minWidth: 63,
    height: 29,
    borderRadius: 6,
    paddingHorizontal: 12,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 29,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    backgroundColor: '#F4F5F7',
  },
  profileChoiceSmall: {
    minWidth: 37,
    height: 29,
    borderRadius: 6,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 29,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    backgroundColor: '#F4F5F7',
  },
  profileChoiceActive: {
    borderWidth: 1,
    borderColor: colors.actionPrimary,
    color: colors.actionPrimary,
    backgroundColor: '#F2F0FF',
  },
  avatarPickerSheet: {
    minHeight: 332,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 34,
    backgroundColor: colors.surface,
  },
  avatarPickerList: {
    marginTop: 16,
    gap: 10,
  },
  avatarPickerItem: {
    minHeight: 68,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  avatarPickerItemActive: {
    backgroundColor: '#ECEAFF',
  },
  avatarPickerImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPickerCopy: {
    flex: 1,
    marginLeft: 12,
    gap: 3,
  },
  avatarPickerTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  avatarPickerHelper: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  avatarPickerCheck: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    color: colors.actionPrimary,
  },
  avatarPickerCancel: {
    marginTop: 'auto',
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  avatarPickerCancelText: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  photoViewer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  photoViewerDimContent: {
    flex: 1,
    paddingHorizontal: spacing.page,
    paddingTop: 51.5,
    opacity: 0.16,
  },
  photoViewerDate: {
    marginTop: 28,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  photoViewerMockCard: {
    height: 230,
    marginTop: 19,
    borderRadius: 15,
    padding: 12,
    backgroundColor: colors.surface,
  },
  photoViewerMockTitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  photoViewerMockTime: {
    marginTop: 16,
    fontSize: 12,
    lineHeight: 15,
    color: colors.textSecondary,
  },
  photoViewerOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.86)',
  } as any,
  photoViewerTop: {
    marginTop: 103,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCloseButton: {
    position: 'absolute',
    left: 24,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  photoCloseText: {
    fontSize: 28,
    lineHeight: 30,
    color: colors.surface,
  },
  photoCounter: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    color: colors.surface,
  },
  photoViewerImage: {
    width: 322,
    height: 322,
    alignSelf: 'center',
    marginTop: 113,
  },
  photoViewerCaption: {
    position: 'absolute',
    left: 24,
    bottom: 103,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
    color: colors.surface,
  },
  photoDots: {
    position: 'absolute',
    bottom: 66,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  photoDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  photoDotActive: {
    width: 10,
    backgroundColor: colors.surface,
  },
  photoAddButton: {
    position: 'absolute',
    right: 0,
    bottom: 33,
    width: 113,
    height: 34,
    borderTopLeftRadius: 17,
    borderBottomLeftRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.actionPrimary,
  },
  photoAddText: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
    color: colors.surface,
  },
  modalLayer: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'flex-end',
    zIndex: 40,
  } as any,
  modalScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  confirmDeleteSheet: {
    marginHorizontal: 20,
    marginBottom: 28,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    backgroundColor: colors.surface,
  },
  confirmDeleteTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  confirmDeleteText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  confirmDeleteActions: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 10,
  },
  confirmCancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  confirmCancelText: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  confirmDeleteButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
  },
  confirmDeleteButtonText: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
    color: colors.surface,
  },
  logFilterLayer: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'flex-end',
    zIndex: 40,
  } as any,
  doseSheet: {
    height: 300,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 34,
    gap: 12,
    backgroundColor: colors.surface,
  },
  medicineEditSheet: {
    height: 549,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 34,
    gap: 10,
    backgroundColor: colors.background,
  },
  sheetTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sheetLabel: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  timePickerSheet: {
    height: 362,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 29,
    backgroundColor: colors.surface,
  },
  textInputSheet: {
    height: 300,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 29,
    gap: 14,
    backgroundColor: colors.surface,
  },
  sheetTextInput: {
    minHeight: 112,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    textAlignVertical: 'top',
  },
  timePickerHeader: {
    height: 42,
    justifyContent: 'center',
  },
  timePickerColumns: {
    marginTop: 54,
    height: 112,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timePickerColumn: {
    width: 90,
    alignItems: 'center',
  },
  timePickerColumnLabel: {
    marginBottom: 8,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  timePickerOption: {
    width: 90,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerOptionActive: {
    height: 47,
    backgroundColor: '#ECE9FF',
  },
  timePickerOptionText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    color: '#C8C9CE',
  },
  timePickerOptionTextActive: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  optionSheet: {
    minHeight: 260,
    maxHeight: 468,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 34,
    backgroundColor: colors.surface,
  },
  logFilterSheet: {
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 318,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 34,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.surface,
  },
  optionSheetList: {
    marginTop: 16,
    gap: 8,
  },
  optionSheetItem: {
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionSheetItemActive: {
    backgroundColor: '#ECE9FF',
  },
  optionSheetText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  optionSheetTextActive: {
    fontWeight: '700',
    color: colors.actionPrimary,
  },
  optionSheetCheck: {
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '700',
    color: colors.actionPrimary,
  },
  unitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  unitPill: {
    width: 45,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  unitPillActive: {
    backgroundColor: '#ECEAFF',
  },
  unitText: {
    fontSize: 11,
    lineHeight: 14.3,
    color: colors.textPrimary,
  },
  sheetActions: {
    marginTop: 'auto',
    flexDirection: 'row',
    gap: 9,
  },
  sheetCancel: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  sheetCancelText: {
    fontSize: 16,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sheetConfirm: {
    flex: 1,
    height: 42,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.actionPrimary,
  },
  sheetConfirmText: {
    fontSize: 16,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.surface,
  },
  sheetFullButton: {
    height: 42,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.actionPrimary,
  },
  saveButton: {
    position: 'absolute',
    left: spacing.page,
    right: spacing.page,
    bottom: 25,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.actionPrimary,
  },
  saveText: {
    fontSize: 16,
    lineHeight: 16,
    fontWeight: '700',
    color: colors.surface,
  },
  bottomNav: {
    position: 'absolute',
    left: '50%',
    bottom: Platform.OS === 'web' ? 24 : 17,
    width: 272,
    height: 59,
    marginLeft: -136,
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 9px 20px rgba(170, 176, 184, 0.08)' }
      : {
          shadowColor: '#AAB0B8',
          shadowOffset: { width: 0, height: 9 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
        }),
    elevation: 6,
  },
  navItem: {
    flex: 1,
    height: 51,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  navIconImage: {
    width: 20,
    height: 20,
  },
  navPressed: {
    backgroundColor: '#F7F6FF',
  },
  navLabel: {
    ...typography.nav,
    color: colors.textSecondary,
  },
  navLabelActive: {
    ...typography.navActive,
    color: colors.actionPrimary,
  },
  vaccinePage: {
    flex: 1,
    backgroundColor: colors.background,
  },
  vaccineScrollContent: {
    paddingHorizontal: spacing.page,
    paddingTop: 7.5,
    paddingBottom: 24,
  },
  vaccineReminderCard: {
    marginTop: 20,
    height: 60,
    borderRadius: 17,
    padding: 12,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },
  vaccineReminderBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vaccineReminderIcon: {
    width: 31,
    height: 31,
    borderRadius: 15.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBD1',
  },
  vaccineReminderIconImage: {
    width: 16,
    height: 16,
  },
  vaccineReminderCopy: {
    flex: 1,
    gap: 2,
  },
  vaccineReminderTitle: {
    fontSize: 13,
    lineHeight: 19.5,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  vaccineReminderMeta: {
    fontSize: 11,
    lineHeight: 14.3,
    color: colors.textSecondary,
  },
  vaccineReminderChevron: {
    width: 18,
    height: 18,
  },
  vaccineSectionTitle: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  vaccineTimeline: {
    marginTop: 16,
    width: '100%',
  },
  vaccineTimelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 9,
  },
  vaccineAgeRail: {
    width: 42,
    alignItems: 'center',
  },
  vaccineRailTopSlot: {
    height: 31,
    width: 1,
    alignItems: 'center',
  },
  vaccineAgeText: {
    width: 42,
    fontSize: 11,
    lineHeight: 12,
    fontWeight: '500',
    color: '#45556C',
    textAlign: 'center',
  },
  vaccineAgeGap: {
    height: 9,
  },
  vaccineRailDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1,
    borderColor: '#AEB3BC',
    backgroundColor: colors.background,
  },
  vaccineRailBottomSlot: {
    flex: 1,
    width: 1,
    minHeight: 53,
    alignItems: 'center',
  },
  vaccineRailSegment: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(139, 139, 148, 0.5)',
  },
  vaccineRailTopSegment: {
    height: 22,
  },
  vaccineRailEndSegment: {
    backgroundColor: '#D9D9D9',
  },
  vaccineCardStack: {
    flex: 1,
    gap: 10,
    paddingBottom: 10,
  },
  vaccineTimelineCard: {
    minHeight: 124,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    gap: 6,
  },
  vaccineCardTitle: {
    fontSize: 13,
    lineHeight: 19.5,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  vaccineCardMeta: {
    fontSize: 11,
    lineHeight: 14.3,
    color: colors.textSecondary,
  },
  vaccineCardActions: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vaccineStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  vaccineStatusText: {
    fontSize: 13,
    lineHeight: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  vaccineRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.2,
    borderColor: '#8B8B94',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  vaccineRadioChecked: {
    borderColor: colors.actionPrimary,
    backgroundColor: colors.actionPrimary,
  },
  vaccineRadioCheck: {
    color: colors.surface,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
  },
  vaccineChangeDateText: {
    fontSize: 13,
    lineHeight: 13,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  vaccineFutureRow: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    overflow: 'hidden',
  },
  vaccineFutureAge: {
    minWidth: 42,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  vaccineFutureLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F8FAFC',
  },
  vaccineDisclaimer: {
    marginTop: 12,
    fontSize: 11,
    lineHeight: 14.3,
    color: colors.textSecondary,
  },
  vaccineModalLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 40,
    justifyContent: 'flex-end',
  },
  vaccineModalOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  vaccineDateSheet: {
    height: 362,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 29,
    backgroundColor: colors.surface,
  },
  vaccineSheetTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  vaccineDatePicker: {
    marginTop: 24,
    height: 180,
    borderRadius: 17,
    flexDirection: 'row',
    gap: 9,
    backgroundColor: colors.surface,
  },
  vaccineDateColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  vaccineDateLabel: {
    fontSize: 11,
    lineHeight: 14.3,
    color: colors.textSecondary,
  },
  vaccineDateSide: {
    fontSize: 13,
    lineHeight: 17,
    color: colors.textSecondary,
    opacity: 0.45,
  },
  vaccineDateSelected: {
    width: 90,
    height: 47,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECEAFF',
  },
  vaccineDateSelectedText: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  vaccineSheetActions: {
    position: 'absolute',
    left: spacing.page,
    right: spacing.page,
    bottom: 25,
    height: 42,
    flexDirection: 'row',
    gap: 9,
  },
  vaccineCancelButton: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  vaccineCancelText: {
    fontSize: 16,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  vaccineConfirmButton: {
    flex: 1,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.actionPrimary,
  },
  vaccineConfirmText: {
    fontSize: 16,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.surface,
  },
  vaccineNoticeContent: {
    paddingHorizontal: spacing.page,
    paddingTop: 7.5,
    paddingBottom: 48,
  },
  vaccineQaCard: {
    borderRadius: 12,
    padding: 12,
    gap: 12,
    backgroundColor: colors.surface,
  },
  vaccineQuestion: {
    fontSize: 13,
    lineHeight: 19.5,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  vaccineAnswer: {
    fontSize: 13,
    lineHeight: 19.5,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  vaccineRiskNotice: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.diaper,
  },
  vaccineRiskText: {
    fontSize: 13,
    lineHeight: 19.5,
    color: colors.textPrimary,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },
  toast: {
    pointerEvents: 'none',
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    maxWidth: 295,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(34, 34, 41, 0.88)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transform: [{ translateY: -24 }],
    zIndex: 20,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 12px 28px rgba(15, 23, 42, 0.18)' }
      : {
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.18,
          shadowRadius: 28,
        }),
    elevation: 18,
  },
  toastCritical: {
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  toastIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  toastIconText: {
    fontSize: 13,
    lineHeight: 15,
    fontWeight: '800',
    color: colors.actionPrimary,
  },
  toastText: {
    color: colors.surface,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
    textAlign: 'center',
  },
});
