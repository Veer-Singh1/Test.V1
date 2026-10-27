"""Narration segments, shot list and stock-media wish list for every scene.

Segment text must match the narration in script.md exactly; `python -m pipeline.check_script`
verifies that. `tts` overrides what the voice says when it should differ from the subtitle text.
Shots tile each scene: a shot starts at segment `from` (optionally `frac` of the way into it)
and runs until the next shot starts.
"""
from .config import AMBER, CORAL, CYAN, INK  # noqa: F401


def seg(text, tts=None, gap=None, silent=None, pace=1.0):
    return {"text": text, "tts": tts, "gap": gap, "silent": silent, "pace": pace}


def label(text, at, dur, color=INK, pos="top-left", size=58):
    return {"text": text, "at": at, "dur": dur, "color": color, "pos": pos, "size": size}


def manim(module, cls, frm=0, frac=0.0):
    return {"kind": "manim", "module": module, "cls": cls, "from": frm, "frac": frac}


def footage(key, frm=0, frac=0.0, labels=(), start=None):
    return {"kind": "footage", "key": key, "from": frm, "frac": frac, "labels": list(labels), "start": start}


def photo(key, frm=0, frac=0.0, labels=(), zoom=(1.0, 1.12), pan=(0.0, 0.0)):
    return {"kind": "photo", "key": key, "from": frm, "frac": frac, "labels": list(labels), "zoom": zoom, "pan": pan}


SCENES = [
    {"id": "s01", "title": 'Hook', "segments": [
        seg('The phone in your pocket contains gold, copper and dozens of other metals, and every gram of them was dug out of the ground.'),
        seg('In South Africa, the deepest gold mines reach about four kilometres underground.'),
        seg('And from one tonne of gold ore, you get only about five grams of gold.'),
        seg('So how do we find these metals, get them out of the rock — and what does it cost the planet?'),
        seg("Let's dig in.", gap=0.9),
    ], "shots": [
        photo("smartphone", 0, labels=[label("Gold · Copper · Platinum · Cobalt…", 0.6, 4.0, AMBER)]),
        footage("mine_tunnel", 1, labels=[label("~4 km deep", 0.4, 3.0, AMBER, "top-left", 72)]),
        manim("s01_hook", "S01Scale", 2),
        footage("gold_pour", 3),
    ]},
    {"id": "s02", "title": 'Title card', "fixed": 4.0, "segments": [

    ], "shots": [
        manim("s02_title", "S02Title"),
    ]},
    {"id": "s03", "title": 'Ores and refining', "segments": [
        seg("Most metals aren't found pure."),
        seg("In rock, they're chemically joined to other elements, usually oxygen or sulphur."),
        seg('A rock that contains enough of a useful mineral to be worth the cost of mining and processing is called an ore.'),
        seg("The key words are 'worth the cost': if there's too little of the mineral, it isn't an ore."),
        seg('Refining is the set of processes that separate the pure metal from everything else in the ore.', gap=0.7),
    ], "shots": [
        manim("s03_ores", "S03Ores"),
    ]},
    {"id": "s04", "title": "South Africa's mineral wealth", "segments": [
        seg('South Africa is one of the richest mining countries in the world.'),
        seg('Gold comes from the Witwatersrand basin, across Gauteng, the Free State and North West.'),
        seg('Platinum and chrome come from the Bushveld Igneous Complex in Limpopo and North West.'),
        seg('Iron ore is mined at Sishen, and manganese in the Kalahari field, both in the Northern Cape.'),
        seg('Coal comes mainly from Mpumalanga and Limpopo, diamonds from Kimberley and coastal deposits, and copper from Phalaborwa.'),
        seg('Mining brings jobs, foreign income and raw materials for industry.', gap=0.8),
    ], "shots": [
        manim("s04_map", "S04Map"),
    ]},
    {"id": "s05", "title": 'What the minerals are used for', "segments": [
        seg('These minerals end up all around you: gold in jewellery, electronics and medicine; platinum in catalytic converters, which clean car exhaust; chrome in stainless steel, and manganese to make steel stronger; iron in the steel itself; coal in power stations; diamonds in cutting and drilling tools; and copper in electrical wiring.', gap=0.8),
    ], "shots": [
        manim("s05_uses", "S05Uses"),
    ]},
    {"id": "s06", "title": 'Three ways to mine', "segments": [
        seg('How a mineral is mined depends on how deep the ore lies.'),
        seg('For deep ore, like gold and platinum, we use shaft mining: a vertical shaft is sunk into the ground, and horizontal tunnels are dug out to the ore.'),
        seg('Miners, machines and ore travel up and down in cages and lifts.'),
        seg('For ore close to the surface, like iron, coal, copper and diamonds, we use open cast mining.'),
        seg('The soil and rock on top, called the overburden, is stripped away, and the ore is dug from a huge pit that deepens in steps called benches.'),
        seg("And for small deposits of gold and diamonds in riverbeds, there's panning: gravel is swirled with water in a pan, heavy particles sink, and the lighter sand washes over the edge.", gap=0.8),
    ], "shots": [
        manim("s06_mining", "S06Shaft", 0),
        footage("open_pit", 3, labels=[label("Open cast mine", 0.4, 3.0, AMBER)]),
        manim("s06_mining", "S06OpenPit", 4),
    ]},
    {"id": "s07", "title": 'Refining, stage 1: physical separation', "segments": [
        seg('Once the ore is out, refining begins.'),
        seg("Stage one is physical separation, which doesn't change the substances chemically."),
        seg('The rock is crushed and ground into small pieces or a fine powder.'),
        seg('Useless rock is sorted out by hand or sifted away.'),
        seg('Then washing, sieving and gravity — panning or sluicing — separate heavy mineral particles from lighter waste.', gap=0.7),
    ], "shots": [
        manim("s07_physical", "S07Physical"),
    ]},
    {"id": "s08", "title": 'Refining, stage 2: reduction', "segments": [
        seg('Stage two is chemical.'),
        seg('Many metals occur as metal oxides, so we need to remove the oxygen.'),
        seg('Removing oxygen from a compound is called reduction; gaining oxygen is oxidation.'),
        seg('The most common reducing agent is carbon, as coke or charcoal.'),
        seg('At high temperatures, carbon attracts the oxygen more strongly than the metal does, so it takes the oxygen and leaves pure molten metal behind.'),
        seg('Take lead: lead oxide plus carbon gives lead plus carbon monoxide.'),
        seg("The lead oxide loses oxygen, so it's reduced."),
        seg("The carbon gains oxygen, so it's oxidised.", gap=0.8),
    ], "shots": [
        manim("s08_reduction", "S08Reduction"),
    ]},
    {"id": "s09", "title": 'Refining iron and lead', "segments": [
        seg('Iron is made in a blast furnace.'),
        seg('Iron ore, coke and limestone go in at the top, and hot air is blown in at the bottom.'),
        seg('The carbon burns to form carbon monoxide, which reduces the iron oxide to molten iron.'),
        seg('The limestone removes sandy impurities as slag, which floats on the molten iron and is drained off.'),
        seg('For lead, the ore galena — lead sulphide — is crushed and roasted in air, forming lead oxide and sulphur dioxide gas.'),
        seg('The lead oxide is then reduced with coke.', gap=0.8),
    ], "shots": [
        manim("s09_iron_lead", "S09IronLead"),
    ]},
    {"id": "s10", "title": 'Refining copper and gold', "segments": [
        seg('Copper ore is crushed and heated with oxygen, giving copper sulphide and iron oxide.'),
        seg("Silica is added, which combines with the iron oxide to form slag, and that's removed."),
        seg('Heating the copper sulphide in air gives impure copper, which is then purified.'),
        seg('Gold is different.'),
        seg('The ore is crushed, washed and filtered, then a cyanide solution dissolves the gold, and zinc brings it back out of the solution.'),
        seg('With only about five grams per tonne, producing one kilogram of gold means processing two hundred tonnes of ore.', gap=1.0),
    ], "shots": [
        manim("s10_copper_gold", "S10CopperGold"),
    ]},
    {"id": "s11", "title": 'Impact on the environment', "segments": [
        seg("Mining comes at a cost, and because the Earth's spheres are linked, the damage spreads."),
        seg('Mines use huge amounts of water and electricity.'),
        seg('Chemicals and acid drainage from old mines leak into rivers and groundwater — the hydrosphere.'),
        seg('Pits, waste rock and mine dumps change the land permanently — the lithosphere.'),
        seg('Dust and gases from blasting, crushing and smelting pollute the atmosphere.'),
        seg('And habitats are destroyed, threatening biodiversity in the biosphere.'),
        seg("Follow one chain to the end: blasting releases dust, the dust settles on leaves, it blocks sunlight, photosynthesis drops, and a nearby farmer's crop yield falls.", gap=0.9),
    ], "shots": [
        manim("s11_environment", "S11Environment"),
    ]},
    {"id": "s12", "title": 'Impact on people, and rehabilitation', "segments": [
        seg('For people, mining is a mixed blessing.'),
        seg('It creates jobs, builds roads and towns, and earns billions of rands in foreign income.'),
        seg('But mine work is dangerous, and breathing in fine dust causes lung diseases such as silicosis and pneumoconiosis.'),
        seg("That's why, by law, mining companies must rehabilitate the land when mining stops: make the site safe and stable, remove pollutants and treat the water, reshape the land and replace the topsoil stored at the start, replant indigenous plants, and restore rivers and wetlands.", gap=0.9),
    ], "shots": [
        manim("s12_people", "S12People"),
    ]},
    {"id": "s13", "title": 'Recap and quiz', "segments": [
        seg('Quick recap.'),
        seg('An ore is worth the cost of mining.'),
        seg('Shaft mining reaches deep ore; open cast mining takes ore near the surface.'),
        seg('Refining separates the metal physically, then chemically by reduction.'),
        seg('And mines must be rehabilitated when they close.', gap=0.7),
        seg('Your turn — pause if you need to.', pace=0.9),
        seg('One: in lead oxide plus carbon gives lead plus carbon monoxide, which substance is reduced?'),
        seg('Two: at five grams per tonne, how many tonnes of ore give one kilogram of gold?'),
        seg('Three: which mining method suits coal close to the surface?', gap=0.2),
        seg('', silent=5.0, gap=0.2),
        seg('Answers!'),
        seg('One: the lead oxide, because it loses oxygen.'),
        seg('Two: two hundred tonnes.'),
        seg('Three: open cast mining.'),
        seg("Nail those, and you're ready for the mining questions in your exam.", gap=0.6),
    ], "shots": [
        manim("s13_quiz", "S13Recap", 0),
        manim("s13_quiz", "S13Quiz", 5),
    ]},
    {"id": "s14", "title": 'End card', "fixed": 7.0, "segments": [

    ], "shots": [
        manim("s14_end", "S14End"),
    ]},
]

ASSETS = {
    "smartphone":  {"kind": "photo", "desc": "Close-up of a smartphone circuit board",
                    "queries": ["smartphone circuit board", "phone motherboard", "smartphone close up"]},
    "mine_tunnel": {"kind": "video", "desc": "Miners working in a deep underground tunnel",
                    "queries": ["underground mine tunnel", "miners underground", "mine shaft"]},
    "gold_pour":   {"kind": "video", "desc": "Molten gold being poured into a mould",
                    "queries": ["molten gold pouring", "gold casting", "molten metal pouring"]},
    "open_pit":    {"kind": "video", "desc": "Aerial view of a huge open pit mine with benches",
                    "queries": ["open pit mine aerial", "open cast mine", "quarry aerial"]},
}

MATH_CHECKS = [  # (what is shown on screen, value computed here, value shown)
    ("Gold: 1 000 g ÷ 5 g per tonne", 1000 / 5, 200.0),
    ("Gold: 5 g per tonne × 200 tonnes", 5 * 200, 1000.0),
]
