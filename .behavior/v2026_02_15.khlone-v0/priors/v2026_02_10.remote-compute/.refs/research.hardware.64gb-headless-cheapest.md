# research: cheapest 64GB headless machines

> research date: 2026-02-10
> priority: cost (primary), size (secondary), noise (don't care)

---

## tl;dr — sorted by price

| option | price | form factor | power (idle) | notes |
|--------|-------|-------------|--------------|-------|
| **dell poweredge r710** | $165-200 | 2u rack | ~150w | oldest, cheapest, ddr3 |
| **dell poweredge r630** | $200-300 | 1u rack | ~150w | sweet spot: modern ddr4, cheap |
| **dell poweredge r720** | $200-350 | 2u rack | ~150w | more drive bays than r630 |
| **hp proliant dl360 g9** | $250-400 | 1u rack | ~120w | comparable to r630 |
| **used optiplex 7060/7070** | $250-450 | micro/sff | ~20w | quieter, tiny, but costlier |
| **dell poweredge t430/t630** | $400-700 | tower | ~100w | tower = easier to place |
| **lenovo thinkcentre m75q** | $450 | tiny | ~15w | new-ish, efficient, premium |

**winner**: dell poweredge r630 at **$200-300** with 64gb ddr4

---

## tier 1: under $250 (rack servers)

### dell poweredge r710 — $165-200

the absolute cheapest 64gb machine you can buy.

| spec | value |
|------|-------|
| cpu | 2x xeon x5650/x5670 (12 cores total) |
| ram | 64gb ddr3 ecc |
| form | 2u rack |
| power | ~150w idle |
| age | 2010 era |

**pros**: dirt cheap, proven, huge community
**cons**: ddr3 (slower), old cpus, loud, power hungry

**sources**:
- [ebay - r710 64gb listings](https://www.ebay.com/b/Dell-PowerEdge-R710-64-GB-RAM-Computer-Servers/11211/bn_120502993)
- one user reported **$165** with free ship for 64gb config

---

### dell poweredge r630 — $200-300

the **recommended pick** for cheapest modern 64gb.

| spec | value |
|------|-------|
| cpu | 2x xeon e5-2620v4 (16 cores total) |
| ram | 64gb ddr4 ecc |
| form | 1u rack |
| power | ~150w idle |
| network | 10gbe/25gbe options |
| age | 2015-2017 era |

**pros**: ddr4, modern-ish cpus, 1u (half the depth of r710), idrac enterprise
**cons**: still loud, still 150w

**example listings**:
- gcb computers: **$200** — 16 cores, 64gb, idrac enterprise
- ebay range: **$200-400** based on config

**sources**:
- [gcb computers - $200 r630](https://servers.gcbcomputers.com/2026/01/28/200-dell-poweredge-r630-server-16-cpu-cores-64gb-ram-idrac-enterprise-10g25g-networking/)
- [ebay - r630 64gb category](https://www.ebay.com/b/Poweredge-R630-64-GB-RAM-Computer-Servers/11211/bn_7115655297)

---

### dell poweredge r720 — $200-350

like the r630 but 2u with more drive bays.

| spec | value |
|------|-------|
| cpu | 2x xeon e5-2650v2 (16 cores total) |
| ram | 64gb ddr3 ecc |
| form | 2u rack |
| power | ~150w idle |
| storage | up to 16x 2.5" or 8x 3.5" bays |

**pros**: tons of storage expansion, cheap
**cons**: ddr3, 2u takes more space

**sources**:
- [ebay - r720 listings](https://www.ebay.com/b/Dell-PowerEdge-R730-Computer-Servers/11211/bn_7115351396)

---

### hp proliant dl360 g9 — $250-400

hp's answer to the r630.

| spec | value |
|------|-------|
| cpu | 2x xeon e5-2640v3 (16 cores total) |
| ram | 64gb ddr4 ecc |
| form | 1u rack |
| power | ~120w idle |
| management | ilo (hp's idrac equivalent) |

**pros**: slightly lower power than dell, good ilo management
**cons**: hp parts sometimes pricier

**sources**:
- [ebay - dl360 g9 64gb](https://www.ebay.com/b/HP-ProLiant-DL360-64-GB-RAM-Computer-Servers/11211/bn_93428172)
- one entry: **$366** trend price

---

## tier 2: $250-500 (mini pcs + towers)

### used dell optiplex 7060/7070 micro — $250-450

if you want small + quiet but still cheap.

| spec | value |
|------|-------|
| cpu | i7-9700 (8 cores) |
| ram | 64gb ddr4 |
| form | 1 liter micro |
| power | ~20w idle |

**pros**: tiny, quiet, sips power, fits on a shelf
**cons**: single socket (fewer cores than dual xeon), costs more than rack servers

**sources**:
- [ebay - optiplex 7070 64gb](https://www.ebay.com/itm/116040438515) — **$249** base, config to 64gb

---

### dell poweredge t430 / t630 — $400-700

tower form factor = no rack needed.

| spec | value |
|------|-------|
| cpu | 2x xeon e5-2600 series |
| ram | 64gb+ ddr4 ecc |
| form | tower (5u equivalent) |
| power | ~100w idle |

**pros**: tower sits on floor, quieter than rack, expandable
**cons**: large footprint, heavier, costs more than 1u/2u

**sources**:
- [ebay - t630 64gb](https://www.ebay.com/itm/205746814987)
- [ebay - t430 64gb](https://www.ebay.com/itm/156092844582)

---

## tier 3: $450+ (mini pcs — quiet + efficient)

### lenovo thinkcentre m75q gen 2 — $450

best option if you want small, quiet, AND 64gb pre-configured.

| spec | value |
|------|-------|
| cpu | ryzen 7 pro 5750ge (8 cores) |
| ram | 64gb ddr4 |
| form | tiny (1 liter) |
| power | ~15w idle |

**pros**: modern, quiet, efficient, refurbished with warranty
**cons**: most expensive option on this list

**sources**:
- [ebay - m75q g2 64gb](https://www.ebay.com/itm/156663242049) — **$451**

---

## power cost analysis

since you don't care about noise, let's talk power cost:

| machine | idle watts | yearly kwh | cost @ $0.12/kwh |
|---------|------------|------------|------------------|
| r630/r710/r720 | 150w | 1,314 kwh | **$158/yr** |
| optiplex micro | 20w | 175 kwh | **$21/yr** |
| thinkcentre tiny | 15w | 131 kwh | **$16/yr** |

**delta**: rack server costs ~$140/yr more in power than a mini pc.

over 3 years:
- r630 total cost: $250 + ($158 × 3) = **$724**
- optiplex total cost: $350 + ($21 × 3) = **$413**

**takeaway**: if you'll run it 24/7 for years, the mini pc is cheaper total. if you only run it work hours or don't care about power bills, the r630 wins on upfront cost.

---

## size comparison

| machine | dimensions | volume |
|---------|------------|--------|
| optiplex micro | 18 × 18 × 3.5 cm | **1.1 L** |
| thinkcentre tiny | 18 × 18 × 3.5 cm | **1.1 L** |
| r630 (1u) | 43 × 68 × 4.3 cm | **12.5 L** |
| r720 (2u) | 43 × 68 × 8.6 cm | **25 L** |
| t630 (tower) | 22 × 45 × 54 cm | **53 L** |

**takeaway**: rack servers are 10-50x the volume of mini pcs. if size matters even a little, mini pcs win. if you have floor/closet space, rack servers are fine.

---

## where to buy

### best for cheapest servers
- [ebay - 64gb servers](https://www.ebay.com/b/64-GB-Memory-RAM-Capacity-Computer-Servers/11211/bn_879840)
- [r/homelabsales](https://reddit.com/r/homelabsales) — reddit marketplace, often better deals than ebay
- [gcb computers](https://servers.gcbcomputers.com/) — specialized server reseller
- [techmikeny](https://techmikeny.com/) — dell poweredge specialist

### best for refurbished mini pcs
- [ebay - dell optiplex 64gb](https://www.ebay.com/b/64gb-Ram-Computer/179/bn_7023352092)
- [discount computer depot](https://discountcomputerdepot.com/)
- [system liquidation](https://systemliquidation.com/collections/refurbished-desktop-computers/ram_64gb)

---

## recommendation matrix

| if you want... | buy this | price |
|----------------|----------|-------|
| **absolute cheapest** | dell poweredge r710 64gb | $165-200 |
| **cheapest + modern (ddr4)** | dell poweredge r630 64gb | $200-300 |
| **cheapest + tower form** | dell poweredge t430 64gb | $400-500 |
| **small + cheap** | dell optiplex 7070 64gb | $250-350 |
| **small + quiet + warranty** | lenovo m75q gen 2 64gb | $450 |

---

## final recommendation

**for pure cost, skip size concerns**: dell poweredge r630 at **$200-300**
- 16+ cores, 64gb ddr4, 1u rack
- modern enough (ddr4, idrac), cheap enough
- loud and power hungry, but you said you don't care

**if size matters even a little**: dell optiplex 7070 micro at **$250-350**
- only $50-100 more than the r630
- 1/10th the volume
- 1/7th the power draw
- quieter (though you don't care)

---

## sources

### guides
- [servermall - best used server for home lab](https://servermall.com/blog/best-used-server-for-home-lab/)
- [medium - affordable used servers](https://medium.com/@fabioandre86/affordable-used-servers-building-your-homelab-on-a-budget-fa34bf84f3df)
- [edy werder - best server for home lab 2025](https://edywerder.ch/best-server-for-home-lab/)
- [homelabsec - home server build guide](https://homelabsec.com/posts/home-server-build-guide/)

### power info
- [dell - poweredge power settings](https://www.dell.com/support/kbdoc/en-us/000202926/poweredge-power-settings)
- [tpcdb - r710 power consumption](https://www.tpcdb.com/product.php?id=2325)
- [dell community - optiplex 7060 power usage](https://www.dell.com/community/en/conversations/optiplex-desktops/power-usage-of-7060-sff/647f948bf4ccf8a8de6d9865)

### marketplaces
- [ebay - dell 64gb servers](https://www.ebay.com/b/Dell-64GB-RAM-Network-Servers/11211/bn_2800397)
- [ebay - poweredge r630 64gb](https://www.ebay.com/b/Poweredge-R630-64-GB-RAM-Computer-Servers/11211/bn_7115655297)
- [ebay - poweredge r710 64gb](https://www.ebay.com/b/Dell-PowerEdge-R710-64-GB-RAM-Computer-Servers/11211/bn_120502993)
- [ebay - hp proliant dl360 64gb](https://www.ebay.com/b/HP-ProLiant-DL360-64-GB-RAM-Computer-Servers/11211/bn_93428172)
