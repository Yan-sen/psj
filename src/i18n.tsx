import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "en" | "cn";

const LangCtx = createContext<{ lang: Lang; toggle: () => void }>({
  lang: "en",
  toggle: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(
    () => (localStorage.getItem("psj-lang") as Lang) || "en"
  );
  const toggle = () => {
    const next = lang === "en" ? "cn" : "en";
    localStorage.setItem("psj-lang", next);
    setLang(next);
  };
  return <LangCtx.Provider value={{ lang, toggle }}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);

const dict = {
  // nav
  "nav.species": ["Species", "物种目录"],
  "nav.availability": ["Availability", "现货清单"],
  "nav.shipping": ["Shipping", "运输包装"],
  "nav.compliance": ["Compliance", "合规资质"],
  "nav.about": ["About", "关于我们"],
  "nav.inquiry": ["Inquiry", "询盘"],
  "nav.quote": ["Request Quote", "获取报价"],
  // home
  "home.kicker": ["Licensed CITES Exporter · China", "持有 CITES 出口资质 · 中国"],
  // Hamm show pre-order banner
  "hamm.badge": ["Terraristika Hamm · December 2026", "德国 Hamm 爬宠展 · 2026年12月"],
  "hamm.title": ["Retail Pre-orders Now Open — Show Pickup Available", "零售预定通道开启 · 展会现场交付"],
  "hamm.text": [
    "We now accept retail pre-orders for individual animals. Reserve before November 30 and collect your order in person at our table at Terraristika Hamm (December show, Germany). Limited stock — first come, first served.",
    "即日起接受零售预定。11月30日前下单预定，即可在12月德国 Hamm 爬宠展（Terraristika Hamm）展会现场取货。现货数量有限，先到先得。",
  ],
  "hamm.deadline": ["Pre-order deadline: November 30, 2026", "预定截止：2026年11月30日"],
  "hamm.cta": ["Reserve Now", "立即预定"],
  "home.intro": [
    "Henan Pashijia Snake Industry Co., Ltd. specializes in Chinese reptiles and rare species — captive-bred stock, full CITES export permits, IATA-standard live animal packing, and air freight to more than 20 countries and regions. Venomous species available to licensed buyers.",
    "河南省爬世家蛇业有限公司专注中国爬宠及珍稀动物，人工繁育货源，全程办理 CITES 出口许可证，IATA 标准活体包装，已出口全球 20 多个国家与地区。毒蛇类目仅面向持证买家。",
  ],
  "home.browse": ["Browse Species", "浏览物种"],
  "home.index": ["Species Index", "物种索引"],
  "home.viewAll": ["View all →", "查看全部 →"],
  "home.featured": ["Featured Specimens", "精选物种"],
  "home.priceNote": ["Prices in USD · males listed, females 1.5×", "价格为美元 · 标注为雄性价，雌性为 1.5 倍"],
  "home.loading": ["Loading…", "加载中…"],
  "trust.1": ["100% Legal Export", "全程合法合规"],
  "trust.1s": ["CITES permits & quarantine certificates", "CITES 许可与检疫证明"],
  "trust.2": ["200+ Species", "200+ 物种资源"],
  "trust.2s": ["Captive-bred Chinese & international lines", "人工繁育中外品系"],
  "trust.3": ["Expert Packing", "专业包装运输"],
  "trust.3s": ["IATA Live Animals Regulations standard", "IATA 活体动物规章标准"],
  "trust.4": ["Live Arrival", "到货存活保证"],
  "trust.4s": ["Guaranteed with after-sales support", "全程售后支持"],
  // table
  "t.species": ["( Species )", "（物种）"],
  "t.morph": ["( Morph )", "（品系）"],
  "t.size": ["( Size )", "（规格）"],
  "t.status": ["( Status )", "（状态）"],
  "t.price": ["( Price USD )", "（价格 USD）"],
  "t.venomous": ["Venomous", "毒蛇"],
  "t.instock": ["In stock", "现货"],
  "t.preorder": ["Pre-order", "预订"],
  "t.quote": ["Request Quote →", "询价 →"],
  // catalog
  "cat.title": ["Species Catalog", "物种目录"],
  "cat.note": [
    "All specimens are captive bred unless noted. Prices in USD — listed for males; females 1.5× (Chinese species). Venomous and CITES-listed species require buyer qualification review before quoting.",
    "除标注外均为人工繁育个体。价格为美元，标注为雄性价，雌性 1.5 倍（中国物种）。毒蛇及 CITES 附录物种需买家资质审核后报价。",
  ],
  "cat.all": ["All", "全部"],
  "cat.search": ["Search Latin / morph…", "搜索学名 / 品系…"],
  "cat.none": ["No species found.", "未找到物种。"],
  // detail
  "d.size": ["Size / Spec", "规格"],
  "d.avail": ["Availability", "库存状态"],
  "d.origin": ["Origin", "来源"],
  "d.originV": ["Captive Bred · China", "人工繁育 · 中国"],
  "d.category": ["Category", "分类"],
  "d.venomBadge": ["Venomous — Licensed Buyers Only", "毒蛇 — 仅限持证买家"],
  "d.permitBox": [
    "This species is exported under official permit. We handle the Chinese CITES export permit and quarantine certification; permit processing typically adds 2–4 weeks to delivery. Buyers must hold valid import / keeping permits in the destination country.",
    "本物种凭官方许可出口。我方负责办理中国 CITES 出口许可与检疫证明，许可办理通常增加 2–4 周交期。买家须持有目的国有效的进口/饲养许可。",
  ],
  "d.permitLink": ["Read our compliance & venomous policy", "阅读合规与毒蛇销售政策"],
  "d.priceUsd": ["Price (USD)", "价格（美元）"],
  "d.onRequest": ["Price on request", "价格面议"],
  "d.priceSub": ["Listed for males; females 1.5× (Chinese species). Wholesale tiers available.", "标注为雄性价，雌性 1.5 倍（中国物种）。可享批发阶梯价。"],
  "d.placeInquiry": ["Place Inquiry", "提交询盘"],
  "d.requestQuote": ["Request Quote", "获取报价"],
  "d.notFound": ["Species not found.", "未找到该物种。"],
  "d.back": ["Back to catalog", "返回目录"],
  // availability
  "a.title": ["Current Availability", "现货清单"],
  "a.note": [
    "Live stock list for wholesale and retail buyers, updated regularly. Prices in USD, listed for males; females 1.5× (Chinese species). Items marked “Request Quote” are permit-bearing or premium specimens — send an inquiry for a formal quotation.",
    "面向批发与零售买家的实时库存清单，定期更新。价格为美元，标注雄性价，雌性 1.5 倍（中国物种）。标注「询价」的为许可物种或高端个体，请提交询盘获取正式报价。",
  ],
  // inquiry
  "i.title": ["Inquiry / Request Quote", "询盘 / 获取报价"],
  "i.permitNote": [
    "This is a regulated species. Your inquiry will pass a buyer qualification review before quoting — please complete the permit field below.",
    "本物种为管制物种。报价前需通过买家资质审核，请填写下方许可信息。",
  ],
  "i.name": ["Name *", "姓名 *"],
  "i.email": ["Email *", "邮箱 *"],
  "i.country": ["Country / Region *", "国家 / 地区 *"],
  "i.countryPh": ["e.g. United States (state)", "例如：美国（州）"],
  "i.buyerType": ["Buyer type", "买家类型"],
  "i.bt1": ["Wholesaler / Retailer", "批发 / 零售商"],
  "i.bt2": ["Breeder", "繁育场"],
  "i.bt3": ["Zoo / Institution / Research", "动物园 / 机构 / 科研"],
  "i.bt4": ["Individual keeper", "个人玩家"],
  "i.qty": ["Quantity", "数量"],
  "i.qtyPh": ["e.g. 10 pairs", "例如：10 对"],
  "i.permit": ["Import / keeping permit info", "进口 / 饲养许可信息"],
  "i.ifApp": ["(if applicable)", "（如适用）"],
  "i.permitPh": ["Import permit no., keeping license, receiving airport…", "进口许可编号、饲养许可、收货机场…"],
  "i.msg": ["Message", "留言"],
  "i.submit": ["Submit Inquiry", "提交询盘"],
  "i.sending": ["Sending…", "提交中…"],
  "i.fail": ["Submission failed — please try again or contact us via WhatsApp.", "提交失败，请重试或通过 WhatsApp 联系我们。"],
  "i.done": ["Inquiry received", "询盘已收到"],
  "i.doneMsg": [
    "Thank you. Our export team will reply within one business day with a quotation and permit-feasibility assessment for your country. For urgent matters, WhatsApp us at +86 131 0743 7859.",
    "感谢您的询盘。我们的出口团队将在一个工作日内回复报价及贵国的许可可行性评估。紧急事项请联系 WhatsApp：+86 131 0743 7859。",
  ],
  "i.continue": ["Continue browsing", "继续浏览"],
  // basket
  "t.pick": ["( Select )", "（勾选）"],
  "cat.go": ["Go", "搜索"],
  "b.title": ["Inquiry List", "询盘篮"],
  "b.empty": ["No species selected yet.", "尚未勾选物种。"],
  "b.submit": ["Submit Inquiry", "提交询盘"],
  "b.remove": ["Remove", "移除"],
  "b.qty": ["Qty", "数量"],
  "b.qtyPh": ["e.g. 10 pairs", "例如：10 对"],
  "b.added": ["Added to inquiry list", "已加入询盘篮"],
  "d.addToBasket": ["Add to Inquiry List", "加入询盘篮"],
  "d.inBasket": ["In Inquiry List ✓", "已在询盘篮 ✓"],
  "i.selected": ["Selected species", "已选物种"],
  "i.perItemQty": ["Quantity per species", "各物种数量"],
  "i.orPick": ["Tip: tick species in the catalog to add them here.", "提示：可在物种目录勾选物种加入此处。"],
  // whatsapp float
  "wa.label": ["Chat on WhatsApp", "WhatsApp 咨询"],
  // shipping
  "s.title": ["Shipping & Packing", "运输与包装"],
  "s.sub": ["Professional live animal air freight, compliant with IATA Live Animals Regulations (LAR).", "专业活体动物航空运输，符合 IATA 活体动物规章（LAR）。"],
  "s.how": ["How we ship", "运输方式"],
  "s.how1": ["Air freight to the destination airport nearest to you (CIP / DAP airport terms).", "航空货运至您就近的目的机场（CIP / DAP 机场条款）。"],
  "s.how2": ["Certified live-animal boxes: ventilated inner containers, insulated outer carton, heat pack or cold pack matched to season and route.", "认证活体运输箱：透气内盒、保温外箱，按季节与航线配置加热包或冰袋。"],
  "s.how3": ["Venomous reptiles are packed to the IATA LAR venomous standard: double containment, puncture-resistant inner container, and clear outer marking.", "毒蛇按 IATA LAR 毒蛇标准包装：双重容器、防刺穿内胆、外箱醒目标识。"],
  "s.how4": ["Every shipment includes health certificate, quarantine documents, and CITES export permit where applicable.", "每票货物附健康证明、检疫文件，适用时附 CITES 出口许可证。"],
  "s.season": ["Seasonal windows", "季节性窗口"],
  "s.seasonP": ["Shipments are scheduled around temperature windows along the route. During extreme heat or cold we may hold shipments at no cost to the buyer — animal welfare comes first. Your sales contact confirms the flight date with you before packing.", "发运按航线气温窗口安排。极端高温或严寒期间，我们可能免费暂缓发货——动物福利优先。销售顾问会在装箱前与您确认航班日期。"],
  "s.lag": ["Live Arrival Guarantee", "到货存活保证"],
  "s.lagP": ["We guarantee live arrival when the shipment is collected at the airport within the agreed window and our unboxing instructions are followed. In the rare event of a DOA, report with unedited video within 2 hours of collection for replacement or credit per our guarantee terms.", "在约定时限内机场提货并遵循开箱指引的前提下，我们保证活体到货。极少数到货死亡情况，请在提货后 2 小时内提供未剪辑开箱视频，按保证条款补发或折抵货款。"],
  "s.timeline": ["Typical timeline", "典型周期"],
  "s.t1": ["Inquiry confirmed & proforma invoice issued (1–2 days)", "询盘确认，开具形式发票（1–2 天）"],
  "s.t2": ["Payment received (T/T)", "收到货款（电汇）"],
  "s.t3": ["Permit processing where applicable (2–4 weeks for CITES-listed species)", "许可办理（附录物种 2–4 周）"],
  "s.t4": ["Quarantine & flight booking (3–7 days)", "检疫与订舱（3–7 天）"],
  "s.t5": ["Departure, tracking number shared; collection at destination airport", "起飞后共享运单号，目的机场提货"],
  // compliance
  "c.title": ["Compliance & Permits", "合规与许可"],
  "c.sub": ["Legal export is the foundation of our business. This page explains what we handle and what we ask of buyers.", "合法出口是我们的立业之本。本页说明我方办理的事项及对买家的要求。"],
  "c.cites": ["CITES export capability", "CITES 出口能力"],
  "c.citesP": ["We hold CITES export qualifications and can legally export Appendix I, II and III species, as well as captive-bred individuals of Chinese nationally protected species, with official export permits. Every CITES-listed specimen ships with its original permit — copies are provided to the buyer in advance for import clearance preparation.", "我司持有 CITES 出口资质，可合法出口附录 I、II、III 物种及中国重点保护动物的人工繁育个体，并办理官方出口许可证。每只附录物种随货附许可证原件，并提前向买家提供副本以准备进口清关。"],
  "c.ven": ["Venomous species policy", "毒蛇销售政策"],
  "c.ven1": ["Venomous species are offered only to licensed institutions, zoos, research facilities, and keepers holding valid local permits.", "毒蛇仅面向持证机构、动物园、科研单位及持有效当地许可的饲养者销售。"],
  "c.ven2": ["All venomous orders pass a manual buyer qualification review before quoting: destination legality, receiving airport, and import / keeping permits.", "所有毒蛇订单在报价前须经人工买家资质审核：目的地合法性、收货机场、进口/饲养许可。"],
  "c.ven3": ["Packing follows the IATA LAR venomous reptile standard; carriage is limited to airlines and routes that accept venomous live animals.", "包装遵循 IATA LAR 毒蛇标准；仅限承运毒蛇活体动物的航司与航线。"],
  "c.ven4": ["We reserve the right to decline any order where destination legality cannot be verified.", "目的地合法性无法核实订单，我司保留拒绝的权利。"],
  "c.buyer": ["What the buyer provides", "买家需提供"],
  "c.b1": ["Import permit (where the destination country requires one for CITES species).", "进口许可（目的国对 CITES 物种有要求时）。"],
  "c.b2": ["Designated receiving airport and import broker details (US shipments: USFWS 3-177 declaration; EU: TRACES).", "指定收货机场及进口代理信息（美国：USFWS 3-177 申报；欧盟：TRACES）。"],
  "c.b3": ["For venomous species: proof of local keeping permit or institutional license.", "毒蛇类：当地饲养许可或机构资质证明。"],
  "c.docs": ["Documentation in every shipment", "每票货物随附文件"],
  "c.d1": ["Animal health / quarantine certificate issued in China", "中国出具的动物健康/检疫证明"],
  "c.d2": ["CITES export permit (for listed species)", "CITES 出口许可证（附录物种）"],
  "c.d3": ["Air waybill with live animal handling labels", "附活体动物操作标签的航空运单"],
  "c.d4": ["Commercial invoice & packing list", "商业发票与装箱单"],
  "c.cta": ["Questions about a specific species or destination? Send an inquiry — our export team replies within one business day with a permit-feasibility answer for your country.", "对特定物种或目的地有疑问？提交询盘——我们的出口团队将在一个工作日内回复贵国的许可可行性。"],
  // about
  "ab.title": ["About PASHIJIA", "关于爬世家"],
  "ab.p1": ["PASHIJIA is a professional reptile breeder and exporter headquartered in China. We specialize in Chinese reptiles and rare species, with products exported to more than 20 countries and regions worldwide. Our facility maintains breeding lines of 200+ species, from entry-level pet staples to permit-bearing rarities and venomous species for licensed buyers.", "爬世家是总部位于中国的专业爬行动物繁育与出口企业，专注中国爬宠及珍稀动物，产品已出口全球 20 多个国家与地区。繁育基地保有 200+ 物种繁育线，从入门级宠物主力品种到需许可的稀有物种及面向持证买家的毒蛇类。"],
  "ab.p2": ["Every animal we ship is captive bred and acclimated before export. We hold CITES export qualifications and handle the full documentation chain in-house — breeding and utilization licenses, quarantine certification, customs declaration, and CITES export permits — so that our buyers receive fully legal, fully documented shipments.", "每只出口个体均经人工繁育与驯化。我司持有 CITES 出口资质，自主办理完整文件链——驯养繁殖与经营利用许可、检疫证明、海关申报、CITES 出口许可——确保买家收到完全合法、文件齐全的货物。"],
  "ab.s1": ["100% Legal", "全程合法"],
  "ab.s1s": ["Full permits, zero grey zone", "许可齐全，零灰色地带"],
  "ab.s2": ["200+ Species", "200+ 物种"],
  "ab.s2s": ["Breeding lines in-house", "自有繁育线"],
  "ab.s3": ["20+ Countries", "20+ 国家"],
  "ab.s3s": ["Proven export record", "成熟出口记录"],
  "ab.s4": ["Live Arrival", "到货存活"],
  "ab.s4s": ["Guaranteed & supported", "保证并全程售后"],
  "ab.contact": ["Contact", "联系方式"],
  // footer
  "f.contact": ["Contact", "联系方式"],
  "f.assurance": ["Assurance", "服务保障"],
  "f.a1": ["100% legal export with CITES permits", "凭 CITES 许可 100% 合法出口"],
  "f.a2": ["Live Arrival Guarantee", "到货存活保证"],
  "f.a3": ["Expert packing & air transport", "专业包装与航空运输"],
  "f.a4": ["Exported to 20+ countries and regions", "已出口全球 20 多个国家与地区"],
  "f.rights": ["All rights reserved.", "版权所有。"],
} as const;

export type DictKey = keyof typeof dict;

export function T({ k }: { k: DictKey }) {
  const { lang } = useLang();
  return <>{dict[k][lang === "en" ? 0 : 1]}</>;
}

export function useT() {
  const { lang } = useLang();
  return (k: DictKey) => dict[k][lang === "en" ? 0 : 1];
}
