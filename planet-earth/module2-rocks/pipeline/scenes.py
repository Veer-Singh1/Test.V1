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
        seg("Look closely at a rock and you're looking at a story millions of years long."),
        seg('Some rocks were born in fire, from molten rock deep underground.'),
        seg('Some were built grain by grain at the bottom of ancient seas.'),
        seg('And some were squeezed and baked until they became something completely new.'),
        seg("Today we'll read those stories: igneous, sedimentary and metamorphic rock — how each one forms, how to recognise it, and how one turns into another.", gap=0.9),
    ], "shots": [
        photo("rock_closeup", 0),
        footage("lava_flow", 1, labels=[label("Born in fire", 0.5, 2.6, CORAL)]),
        photo("sandstone_cliffs", 2, labels=[label("Built in layers", 0.4, 2.6, AMBER)]),
        photo("folded_rock", 3, labels=[label("Changed by heat & pressure", 0.4, 2.6, CYAN)]),
        manim("s01_hook", "S01Types", 4),
    ]},
    {"id": "s02", "title": 'Title card', "fixed": 4.0, "segments": [

    ], "shots": [
        manim("s02_title", "S02Title"),
    ]},
    {"id": "s03", "title": "The lithosphere and Earth's layers", "segments": [
        seg('Rocks belong to the lithosphere: the crust plus the rigid top of the mantle.'),
        seg('When the young Earth was extremely hot, the heaviest materials sank to the centre and the lightest floated to the top, so the planet formed layers.'),
        seg('The crust we live on is thin — about five to ten kilometres under the oceans, and up to about fifty under the continents.'),
        seg('Below it lies the mantle, about two thousand nine hundred kilometres thick, then the liquid outer core and the solid inner core, both mostly iron and nickel.', gap=0.7),
    ], "shots": [
        manim("s03_layers", "S03Layers"),
    ]},
    {"id": "s04", "title": 'Minerals and rocks', "segments": [
        seg('Now, two words that are easy to mix up.'),
        seg('A mineral is a naturally occurring, non-living solid with a definite chemical composition.'),
        seg('Quartz, mica, feldspar and gold are all minerals.'),
        seg('A rock is a solid mixture of one or more minerals.'),
        seg('Think of the minerals as the ingredients, and the rock as the baked cake.'),
        seg('Geologists sort rocks into three types, and they group them by one thing: how the rock formed.', gap=0.7),
    ], "shots": [
        manim("s04_minerals", "S04Minerals"),
    ]},
    {"id": "s05", "title": 'Igneous rock: how it forms', "segments": [
        seg("Igneous means 'fiery'."),
        seg("Igneous rocks form when molten rock cools and hardens, and they were the first rocks to form in the Earth's crust."),
        seg('It starts when a crack or weakness opens in the crust.'),
        seg('The pressure drops, and magma — molten rock below the surface — pushes upwards along the line of weakness.'),
        seg("If the magma is forced in among other rocks and cools inside the crust, it forms intrusive rock: intrusive means 'forced in'."),
        seg("If it pours out onto the surface as lava and cools there, it forms extrusive rock: 'forced out'.", gap=0.7),
    ], "shots": [
        manim("s05_igneous", "S05Igneous"),
    ]},
    {"id": "s06", "title": 'Igneous rock: characteristics', "segments": [
        seg('So how do you recognise igneous rock?'),
        seg("First, it's crystalline: as magma cools, silica, iron and magnesium combine into mineral crystals."),
        seg('The speed of cooling decides their size.'),
        seg("Deep underground, magma cools slowly, so the crystals have time to grow large — that's granite."),
        seg("At the surface, lava cools quickly and the crystals stay tiny — that's basalt."),
        seg('Igneous rock is also massive, meaning it has no layers, and it contains no fossils, because the heat destroys any living material.'),
        seg('Granite, gabbro and dolerite are intrusive.'),
        seg('Basalt, pumice, obsidian and scoria are extrusive — and pumice is so full of gas bubbles that it can float on water.', gap=0.7),
    ], "shots": [
        manim("s06_igneous_traits", "S06IgneousTraits"),
    ]},
    {"id": "s07", "title": 'Sedimentary rock: four steps', "segments": [
        seg('Sedimentary rocks are built from sediment, and the most common way is mechanical, in four steps.'),
        seg('One: erosion.'),
        seg('Rivers, wind and ice wear rock down into smaller pieces, bits of clay and dissolved substances.'),
        seg('Two: transport and deposition.'),
        seg('The pieces are carried away and dropped at the bottom of a sea, lake or valley.'),
        seg('Three: new layers settle on top of older ones, over thousands of years.'),
        seg('Four: compaction and cementation.'),
        seg('The weight of the water and the layers above squashes the lower layers, and dissolved minerals cement the particles together.', gap=0.7),
    ], "shots": [
        manim("s07_sediment", "S07Sediment"),
    ]},
    {"id": "s08", "title": 'Sedimentary rock: other ways and characteristics', "segments": [
        seg('Sedimentary rock can also form chemically, when water evaporates and leaves minerals behind, like rock salt and some limestone.'),
        seg('Or organically, from the compressed remains of living things, like coal and shelly limestone.'),
        seg('You can spot sedimentary rock by its visible layers, called strata.'),
        seg("It's usually softer, and wears away more easily than igneous rock."),
        seg("And it's the rock type where fossils are found."),
        seg('Sandstone is made of sand grains, shale of clay and mud, conglomerate of rounded pebbles, limestone of shells, coral and calcium carbonate, and coal of plant remains.', gap=0.8),
    ], "shots": [
        manim("s08_sediment_types", "S08SedimentTypes"),
    ]},
    {"id": "s09", "title": 'Metamorphic rock: heat and pressure', "segments": [
        seg("Metamorphic means 'changed in form'."),
        seg("These rocks start out as igneous, sedimentary or even other metamorphic rock, and they're changed by heat, pressure, or both — without melting completely."),
        seg('The heat comes from magma pushing into the crust, sometimes as a huge intrusion called a batholith.'),
        seg('It makes the existing crystals re-form as new crystals.'),
        seg('The pressure comes from the weight of the rock above, or from tectonic plates colliding and folding the crust, and it often squeezes the new crystals into bands.'),
        seg('Metamorphic rocks are usually harder and denser than the rock they came from, and they contain no fossils.', gap=0.7),
    ], "shots": [
        manim("s09_metamorphic", "S09Metamorphic"),
    ]},
    {"id": "s10", "title": 'The big five changes', "segments": [
        seg('Learn these five changes.'),
        seg('Shale becomes slate.'),
        seg('Limestone becomes marble.'),
        seg('Sandstone becomes quartzite.'),
        seg('Granite becomes gneiss.'),
        seg('And coal becomes graphite.'),
        seg('Two memory tricks: shale and slate start with the same letter, and sand is mostly quartz, so sandstone becomes quartzite.', gap=0.8),
    ], "shots": [
        manim("s10_pairs", "S10Pairs"),
    ]},
    {"id": "s11", "title": 'The rock cycle', "segments": [
        seg('None of these rocks lasts forever.'),
        seg('Over hundreds of millions of years, rocks are melted, worn away, buried and changed, then form new rocks again.'),
        seg('This never-ending series of changes is the rock cycle, and it has no beginning and no end.'),
        seg("Let's follow one journey."),
        seg("Granite at the surface is broken down where it lies — that's weathering — and the pieces are carried off by erosion."),
        seg('The sand is deposited, then compacted and cemented into sandstone.'),
        seg('Buried deep, heat and pressure turn the sandstone into quartzite.'),
        seg('Pushed deeper still, it melts into magma.'),
        seg('And when that magma cools slowly underground, it forms new granite.', gap=0.9),
    ], "shots": [
        manim("s11_cycle", "S11Cycle"),
    ]},
    {"id": "s12", "title": 'Three exam traps', "segments": [
        seg('Three traps that cost marks.'),
        seg('One: weathering and erosion are not the same thing.'),
        seg('Weathering breaks rock down where it lies; erosion wears it away and carries it off.'),
        seg("Two: metamorphic rock doesn't melt."),
        seg("It changes while it's still solid — if it melts, it becomes magma."),
        seg("Three: the rock cycle doesn't start with igneous rock."),
        seg("Any rock can become any other type, so there's no start and no end.", gap=0.8),
    ], "shots": [
        manim("s12_traps", "S12Traps"),
    ]},
    {"id": "s13", "title": 'Recap and quiz', "segments": [
        seg('Quick recap.'),
        seg('Igneous rock forms when magma or lava cools: crystals, no layers, no fossils.'),
        seg('Sedimentary rock forms when sediment is compacted and cemented: strata, and fossils.'),
        seg('Metamorphic rock is changed by heat and pressure: harder, denser, often banded.', gap=0.7),
        seg('Your turn — pause if you need to.', pace=0.9),
        seg('One: why does granite have large crystals?'),
        seg("Two: what does limestone become when it's metamorphosed?"),
        seg('Three: which two processes turn loose sand into sandstone?', gap=0.2),
        seg('', silent=5.0, gap=0.2),
        seg('Answers!'),
        seg('One: it cooled slowly, deep underground.'),
        seg('Two: marble.'),
        seg('Three: compaction and cementation.'),
        seg("Get all three, and you're ready for the rock cycle questions in your exam.", gap=0.6),
    ], "shots": [
        manim("s13_quiz", "S13Recap", 0),
        manim("s13_quiz", "S13Quiz", 4),
    ]},
    {"id": "s14", "title": 'End card', "fixed": 7.0, "segments": [

    ], "shots": [
        manim("s14_end", "S14End"),
    ]},
]

ASSETS = {
    "rock_closeup":     {"kind": "photo", "desc": "Macro close-up of a granite rock surface",
                         "queries": ["granite texture macro", "granite close up", "rock texture"]},
    "lava_flow":        {"kind": "video", "desc": "Glowing lava flow cooling at the surface",
                         "queries": ["lava flow", "volcano lava", "molten lava"]},
    "sandstone_cliffs": {"kind": "photo", "desc": "Layered sandstone cliffs showing strata",
                         "queries": ["sandstone layers cliff", "rock strata", "sedimentary rock layers"]},
    "folded_rock":      {"kind": "photo", "desc": "Folded, banded metamorphic rock",
                         "queries": ["folded rock layers", "gneiss rock", "metamorphic rock"]},
}

MATH_CHECKS = []  # no on-screen arithmetic in this module
