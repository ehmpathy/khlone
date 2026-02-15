# research: cheap 64GB RAM machines for homelab

> research date: 2026-02-10
> goal: find the cheapest way to get a 64GB RAM, fast CPU machine for remote dev compute

---

## tl;dr

| option | price range | form factor | notes |
|--------|-------------|-------------|-------|
| **minisforum UM790 Pro** | ~$450-550 | mini pc | ryzen 9 7940hs, 64gb ddr5, best value new |
| **minisforum UM890 Pro** | ~$550-650 | mini pc | ryzen 9 8945hs, 64gb ddr5, newer chip |
| **used dell optiplex 7060/7070** | ~$300-450 | sff/micro | i7, 64gb ddr4, project tinyminimicro favorite |
| **used lenovo thinkcentre m75q** | ~$250-400 | tiny | ryzen, 64gb ddr4, proven homelab choice |
| **used hp elitedesk 800 g6** | ~$350-500 | mini | i5/i7 10th gen, 64gb ddr4 |
| **beelink ser7 + upgrade** | ~$600 + ram | mini pc | 32gb stock, 64gb upgradeable |
| **gmktec nucbox m7 ultra** | ~$310 + ram | mini pc | barebones, 64gb ddr5 capable |
| **minisforum ms-01** | ~$640 barebones | workstation | 10gbe, for serious homelab |
| **used dell poweredge r630** | ~$200-400 | 1u rack | enterprise, loud, cheap |

**winner for cost**: used enterprise mini pcs (optiplex, thinkcentre, elitedesk) at $250-450

**winner for new + small**: minisforum UM790 Pro at ~$450-550 with 64gb

---

## critical context: ram prices in 2025-2026

ram prices have skyrocketed due to ai demand:

- **64gb ddr5 kits now cost $500-600** — more than a ps5
- **ddr4 is slightly cheaper** but still elevated
- **shortage expected until q4 2027** at minimum

> "a 128 GB RAM kit now will cost you as much as the mini PC itself"
> — [pc build advisor](https://www.pcbuildadvisor.com/best-mini-pc-for-home-server-the-ultimate-guide-with-comparisons/)

> "64gb of ddr5 memory now costs more than an entire ps5"
> — [tom's hardware](https://www.tomshardware.com/pc-components/ddr5/64gb-of-ddr5-memory-now-costs-more-than-an-entire-ps5-even-after-a-discount-trident-z5-neo-kit-jumps-to-usd600-due-to-dram-shortage-and-its-expected-to-get-worse-into-2026)

**implication**: buy pre-configured 64gb systems rather than barebones + upgrade

---

## option 1: minisforum UM790 Pro / UM890 Pro (best new mini pc value)

### specs
- **cpu**: amd ryzen 9 7940hs (um790) or 8945hs (um890)
- **ram**: 64gb ddr5 (pre-configured)
- **storage**: 1tb nvme
- **ports**: 2x usb4, 2x hdmi, 2.5gbe

### price
- UM790 Pro 64gb: **~$450-550** (on sale $351 barebones)
- UM890 Pro 64gb: **~$550-650** (on sale $439 barebones)

### sources
- [minisforum store - UM790 Pro](https://store.minisforum.com/products/minisforum-um790-pro)
- [walmart - UM790 Pro 64gb](https://www.walmart.com/ip/MINISFORUM-Venus-Series-UM790-Pro-Mini-PC-AMD-Ryzen-9-7940HS-64GB-1TB-PCIe-SSD/5177762568)
- [walmart - UM890 Pro 64gb](https://www.walmart.com/ip/MINISFORUM-UM890-Pro-Mini-PC-AMD-Ryzen-9-8945HS-8C-16T-5-2GHz-64GB-DDR5-1TB-PCIe4-0-SSD-2xUSB4-PD-8K-1xHDMI-1xDP-Four-Outputs-2x-RJ45-BT5-2-4xUSB3-2/11144455204)

### verdict
**best value for new, small, quiet, pre-configured 64gb**

---

## option 2: used enterprise mini pcs (project tinyminimicro)

the "project tinyminimicro" approach uses refurbished enterprise mini pcs from lenovo, hp, and dell. these are 1-liter form factor machines that corporations lease and return after 3-4 years.

### recommended models

| brand | model | max ram | typical price |
|-------|-------|---------|---------------|
| dell | optiplex 7060/7070 micro | 64gb ddr4 | $300-450 |
| lenovo | thinkcentre m75q gen 2 | 64gb ddr4 | $250-400 |
| lenovo | thinkcentre m920q | 64gb ddr4 | $250-350 |
| hp | elitedesk 800 g5/g6 mini | 64gb ddr4 | $350-500 |

### where to buy
- [ebay - dell optiplex](https://www.ebay.com/b/Dell-Optiplex-Desktops/179/bn_7114050175)
- [ebay - hp elitedesk](https://www.ebay.com/b/HP-EliteDesk-PC-Desktops-All-In-One-Computers/179/bn_7116688706)
- [discount computer depot](https://discountcomputerdepot.com/categories/refurbished-computers/desktop-computers/computer-brands/dell-desktops/dell-optiplex-desktops.html)
- [dell refurbished](https://www.dellrefurbished.com/desktop-computers)
- [newegg - dell optiplex 64gb](https://www.newegg.com/p/pl?d=dell+optiplex+64gb+ram)

### sources
- [servethehome - project tinyminimicro intro](https://www.servethehome.com/introducing-project-tinyminimicro-home-lab-revolution/)
- [mini pc reviewer - tinyminimicro guide](https://minipcreviewer.com/revolutionizing-home-labs-with-project-tinyminimicro/)

### verdict
**cheapest path to 64gb if you can find pre-configured units**

---

## option 3: beelink ser7 / ser8 (upgrade path)

### specs
- **cpu**: amd ryzen 7 7840hs (8c/16t, up to 5.1ghz)
- **ram**: 32gb stock, upgradeable to 64gb ddr5
- **storage**: 1tb nvme, expandable
- **ports**: usb4, 2x hdmi, 2.5gbe

### price
- base 32gb config: **~$600**
- 64gb ram upgrade kit: **~$500-600 additional** (current prices)
- total for 64gb: **~$1100-1200**

### sources
- [newegg - beelink ser7](https://www.newegg.com/beelink-barebone-systems-mini-pc-amd-ryzen-7-7840hs-ser7-7840hs/p/2SW-0012-00190)
- [lon.tv - beelink ser7 review](https://blog.lon.tv/2023/10/05/beelink-ser7-review-the-most-powerful-mini-pc-i-have-ever-tested/)
- [techradar - beelink ser8 review](https://www.techradar.com/computing/beelink-ser8-mini-pc-review)

### verdict
**not recommended** — upgrade path makes it expensive vs pre-configured options

---

## option 4: gmktec nucbox series (budget barebones)

### models with 64gb support
- **nucbox m5 ultra**: ryzen 7 7730u, ddr4, $310 barebones
- **nucbox m7 ultra**: ryzen 7 pro 6850u, ddr5, $310 barebones
- **nucbox k8 plus**: ryzen 7 8845hs, ddr5 64gb, ~$700 configured

### sources
- [gizmochina - m5 ultra launch](https://www.gizmochina.com/2025/09/20/gmktec-nucbox-m5-ultra-mini-pc-launched-specs-price/)
- [gizmochina - m7 ultra launch](https://www.gizmochina.com/2025/10/29/gmktec-nucbox-m7-ultra-launched-globally-specs-price/)
- [notebookcheck - m6 ultra review](https://www.notebookcheck.net/Best-value-for-money-GMKtec-NucBox-M6-Ultra-mini-PC-with-AMD-Ryzen-APU-and-USB4-review.1122870.0.html)

### verdict
**barebones only makes sense if you already own ddr5 ram**

---

## option 5: minisforum ms-01 (serious homelab)

### specs
- **cpu**: intel core i9-13900h or i5-12600h
- **ram**: up to 64gb ddr5
- **network**: 2x 10gbe sfp+, 2x 2.5gbe
- **storage**: 3x nvme slots, raid support

### price
- barebones: **$640**
- configured 64gb + 2tb: **~$1100-1200**

### sources
- [minisforum store - ms-01](https://store.minisforum.com/products/minisforum-ms-01)
- [virtualization howto - ms-01 review](https://www.virtualizationhowto.com/2025/01/minisforum-ms-a2-vs-ms-01-best-home-lab-server-in-2025/)
- [edy werder - ms-01 review](https://edywerder.ch/minisforum-ms-01-review/)

### verdict
**overkill for remote dev, but great if you want 10gbe network**

---

## option 6: used enterprise rack servers (divergent)

### why consider
- **dirt cheap**: $200-400 for 64gb+ configs
- **expandable**: up to 768gb ram on some models
- **dual cpu**: massive parallel compute

### downsides
- **loud**: server fans are noisy
- **power hungry**: 100-300w idle
- **large**: 1u-2u rack form factor

### recommended models
| model | price | ram | notes |
|-------|-------|-----|-------|
| dell poweredge r630 | $200-400 | 64gb+ | 1u, dual xeon |
| dell poweredge r720 | $150-300 | 64gb+ | 2u, older but cheap |
| hp proliant dl360 g9 | $200-400 | 64gb+ | 1u, enterprise |

### sources
- [ebay - dell 64gb servers](https://www.ebay.com/b/Dell-64GB-RAM-Network-Servers/11211/bn_2800397)
- [medium - affordable used servers](https://medium.com/@fabioandre86/affordable-used-servers-building-your-homelab-on-a-budget-fa34bf84f3df)

### verdict
**only if noise and power don't matter** — not ideal for home office

---

## option 7: topton / aliexpress mini pcs (budget divergent)

### specs
- **cpu**: intel n100/n305 or i3-n355
- **ram**: up to 64gb ddr5 (some models)
- **price**: $140-300 barebones

### notable model
topton n18 nas motherboard: n150 or i3-n305, 64gb ddr5 support, 6x sata, 10gbe

### sources
- [topton official](https://www.toptonpc.com/)
- [cnx software - topton n18 review](https://www.cnx-software.com/2025/06/26/topton-n18-nas-mini-itx-motherboard-ships-with-intel-n150-or-core-i3-n305-soc-offers-6x-sata-10gbe-2x-2-5gbe/)

### verdict
**risky** — variable quality, limited support, but cheapest hardware path

---

## option 8: used hp z2/z4 workstations (divergent)

### specs
- **cpu**: intel xeon or core i7/i9
- **ram**: up to 128gb ecc
- **form factor**: sff or tower

### price
- hp z2 g4 sff 64gb: **$400-600** refurbished
- hp z4 g4 tower 64gb: **$500-800** refurbished

### sources
- [ebay - hp z4 g4](https://www.ebay.com/b/HP-Z4-G4-PC-Desktops-All-In-One-Computers/179/bn_7116759929)
- [pc server and parts - hp z2](https://pcserverandparts.com/workstations/hp-workstations/hp-z2-g4-workstation/)

### verdict
**good middle ground** — workstation reliability, tower size

---

## divergent idea: don't buy 64gb

### the argument
- 64gb ddr5 kits cost $500-600 alone
- ddr4 64gb kits cost $200-300
- if you buy a mini pc with 32gb, you're still at $300-400 total
- the 64gb upgrade doubles the cost

### alternative approach
- buy **two** 32gb machines (~$300-400 each = $600-800 total)
- use them as a **cluster** for parallelism
- ssh into whichever has capacity

### sources
- [jeff geerling blog - raspberry pi vs mini pc](https://www.jeffgeerling.com/blog/2026/raspberry-pi-cheaper-than-mini-pc/)
- [xda - replaced pi cluster with single mini pc](https://www.xda-developers.com/reasons-replaced-pi-home-lab-cluster-single-mini-pc/)

### verdict
**worth a look** — depends on workload parallelizability

---

## divergent idea: cloud spot instances

### the argument
- aws ec2 spot instances with 64gb: ~$0.10-0.20/hour
- 8 hours/day × 20 days/month = 160 hours = $16-32/month
- break-even vs $500 machine: 15-30 months

### downsides
- latency (~50-100ms vs ~1ms lan)
- monthly cost adds up over years
- requires internet

### sources
- [aws ec2 spot cost info](https://aws.amazon.com/ec2/spot/pricing/)

### verdict
**good for overflow**, not primary — latency matters for terminal work

---

## recommendation matrix

| priority | recommendation | cost |
|----------|----------------|------|
| **cheapest possible** | used optiplex/thinkcentre 64gb on ebay | $250-400 |
| **cheapest new** | minisforum UM790 Pro 64gb | $450-550 |
| **best performance/$ new** | minisforum UM890 Pro 64gb | $550-650 |
| **smallest + new** | minisforum UM790 Pro | $450-550 |
| **enterprise network** | minisforum ms-01 barebones + ram | $640 + ram |
| **maximum ram headroom** | used dell poweredge r630 | $200-400 |

---

## final recommendation

for your usecase (remote dev, terminal-first, local network priority):

**primary**: used lenovo thinkcentre m75q gen 2 or dell optiplex 7060/7070 with 64gb pre-installed
- price: $250-450
- quiet, small, proven
- ddr4 = cheaper than ddr5 alternatives

**fallback if can't find used**: minisforum UM790 Pro with 64gb
- price: ~$450-550
- new warranty, ryzen 9, ddr5
- best new mini pc value in 2025-2026

---

## sources index

### guides and reviews
- [pc build advisor - best mini pc for home server](https://www.pcbuildadvisor.com/best-mini-pc-for-home-server-the-ultimate-guide-with-comparisons/)
- [virtualization howto - best mini pcs 2025](https://www.virtualizationhowto.com/2025/11/the-best-mini-pcs-for-home-labs-in-2025-ranked-by-real-performance/)
- [bitdoze - best mini pc home server 2026](https://www.bitdoze.com/best-mini-pc-home-server/)
- [servethehome - project tinyminimicro intro](https://www.servethehome.com/introducing-project-tinyminimicro-home-lab-revolution/)
- [homelabsec - best mini pc homelab 2025](https://homelabsec.com/posts/best-mini-pc-homelab-2025/)

### price and market
- [tom's hardware - ddr5 price crisis](https://www.tomshardware.com/pc-components/ddr5/64gb-of-ddr5-memory-now-costs-more-than-an-entire-ps5-even-after-a-discount-trident-z5-neo-kit-jumps-to-usd600-due-to-dram-shortage-and-its-expected-to-get-worse-into-2026)
- [trendforce - 64gb ddr5 price report](https://www.trendforce.com/news/2025/11/27/news-64gb-ddr5-ram-reportedly-now-pricier-than-a-playstation-5-amid-soaring-memory-costs/)
- [tweaktown - ram shortage until 2028](https://www.tweaktown.com/news/109222/ram-shortages-are-here-until-2028-64gb-ddr5-is-now-dollars500-256gb-ddr4-costs-over-dollars3000/index.html)

### retailers
- [minisforum official store](https://store.minisforum.com/)
- [ebay - dell optiplex](https://www.ebay.com/b/Dell-Optiplex-Desktops/179/bn_7114050175)
- [newegg - mini pc 64gb ram](https://www.newegg.com/p/pl?d=mini+pc+64gb+ram&N=100006650)
- [discount computer depot](https://discountcomputerdepot.com/)
- [dell refurbished](https://www.dellrefurbished.com/desktop-computers)

### specific products
- [minisforum UM790 Pro](https://store.minisforum.com/products/minisforum-um790-pro)
- [minisforum ms-01](https://store.minisforum.com/products/minisforum-ms-01)
- [beelink ser7 - newegg](https://www.newegg.com/beelink-barebone-systems-mini-pc-amd-ryzen-7-7840hs-ser7-7840hs/p/2SW-0012-00190)
- [gmktec nucbox m7 ultra](https://www.gizmochina.com/2025/10/29/gmktec-nucbox-m7-ultra-launched-globally-specs-price/)

### comparisons
- [tom's hardware - raspberry pi vs mini pc parity](https://www.tomshardware.com/raspberry-pi/raspberry-pi-and-mini-pc-home-lab-prices-hit-parity-as-dram-costs-skyrocket-price-hikes-force-hobbyists-to-weigh-up-performance-versus-power-consumption)
- [xda - why i replaced pi cluster with mini pc](https://www.xda-developers.com/reasons-replaced-pi-home-lab-cluster-single-mini-pc/)
