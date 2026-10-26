"""Narration segments, shot list and stock-asset wish list for every scene.

Segment text must match the narration in script.md exactly; `python -m pipeline.check_script`
verifies that. `tts` overrides what the voice says when it should differ from the subtitle text.
Shots tile each scene: a shot starts at segment `from` (optionally `frac` of the way into it)
and runs until the next shot starts.
"""
from .config import AMBER, CORAL, CYAN, INK


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
    {"id": "s01", "title": "Hook", "segments": [
        seg("A lightning bolt heats the air to around thirty thousand degrees Celsius — about five times hotter than the surface of the Sun."),
        seg("Now zoom out: an entire city, glowing at night."),
        seg("Zoom in: the phone on your bedside table, quietly charging."),
        seg("Wildly different scales… same thing."),
        seg("Electricity."),
        seg("We use it every day."),
        seg("But what actually makes it move?", gap=0.9, pace=0.88),
    ], "shots": [
        footage("lightning", 0, labels=[label("≈ 30,000 °C", 1.2, 4.5, AMBER, "top-left", 72)]),
        footage("city_night", 1),
        footage("phone_charging", 2),
        manim("s01_hook", "S01Spark", 4),
    ]},

    {"id": "s02", "title": "Title card", "fixed": 4.0, "segments": [], "shots": [
        manim("s02_title", "S02Title"),
    ]},

    {"id": "s03", "title": "Charge & circuits", "segments": [
        seg("It starts with electrons: tiny, negatively charged particles inside every atom."),
        seg("In metals like copper, some electrons roam freely between atoms, making metals good conductors."),
        seg("In rubber, glass or plastic, electrons are held tightly — those are insulators."),
        seg("That's why wires are copper inside and plastic outside."),
        seg("But for current to flow, charge needs a complete path: a closed loop."),
        seg("Open a switch, and the flow stops everywhere.", gap=0.8),
    ], "shots": [
        manim("s03_charge", "S03Atoms", 0),
        photo("copper_wire", 3, labels=[label("Copper: conductor", 0.3, 3.2, CYAN, "top-left"),
                                         label("Plastic: insulator", 0.9, 2.6, CORAL, "top-right")]),
        manim("s03_charge", "S03Loop", 4),
    ]},

    {"id": "s04", "title": "Voltage", "segments": [
        seg("So what pushes charge around the loop? Voltage."),
        seg("Think of a battery as a charge pump: chemical reactions give each bit of charge a boost of energy."),
        seg("Voltage is that energy per unit of charge."),
        seg("One volt is one joule per coulomb — the charge of about six quintillion electrons.", gap=0.5),
        seg("Voltage is always a difference between two points — that's why it's called potential difference."),
        seg("A AA battery: one and a half volts.", tts="A double-A battery: one and a half volts."),
        seg("A wall socket: 120 or 230, depending on where you live.",
            tts="A wall socket: a hundred and twenty, or two hundred and thirty, depending on where you live."),
        seg("Transmission lines: hundreds of thousands.", gap=0.6),
    ], "shots": [
        manim("s04_voltage", "S04Voltage", 0),
        photo("aa_batteries", 5, labels=[label("1.5 V", 0.2, 2.6, AMBER, "top-left", 84)]),
        photo("wall_socket", 6, labels=[label("120 V or 230 V", 0.2, 3.4, AMBER, "top-left", 84)]),
        footage("power_lines", 7, labels=[label("100,000s of volts", 0.2, 3.0, AMBER, "top-left", 84)]),
    ]},

    {"id": "s05", "title": "Current", "segments": [
        seg("Current is how much charge flows past a point each second."),
        seg("One ampere, or amp, is one coulomb per second.", gap=0.5),
        seg("Early scientists guessed current flows from positive to negative, and we still draw it that way: conventional current."),
        seg("But in metal wires, the moving charges are electrons, drifting the opposite way."),
        seg("Both pictures give the same answers."),
        seg("Surprisingly, those electrons are slow — a fraction of a millimetre per second, slower than a snail."),
        seg("Yet the light comes on almost instantly: the wire is already full of electrons, and the push races along it at more than half the speed of light.", gap=0.7),
    ], "shots": [
        manim("s05_current", "S05Current", 0),
        footage("snail", 5, labels=[label("Electron drift: < 1 mm/s", 0.4, 4.6, CYAN, "top-left", 64)]),
        manim("s05_current", "S05Signal", 6),
    ]},

    {"id": "s06", "title": "Resistance", "segments": [
        seg("Resistance is opposition to current, measured in ohms — after Georg Ohm — with the symbol omega."),
        seg("Four things set it."),
        seg("Material: copper barely resists; nichrome, used in toasters, resists a lot."),
        seg("Length: longer wire, more resistance."),
        seg("Thickness: thicker wire, less — more lanes for traffic."),
        seg("Temperature: most metals resist more as they heat up.", gap=0.6),
        seg("Resistance is also useful: push current through a high-resistance wire and it gets hot enough to glow — like a toaster element or an old-style light bulb.", gap=0.7),
    ], "shots": [
        manim("s06_resistance", "S06Resistance", 0),
        footage("toaster_glow", 6, labels=[label("Nichrome element", 1.0, 3.0, CORAL, "top-left")]),
        footage("filament_bulb", 6, frac=0.74),
    ]},

    {"id": "s07", "title": "Water analogy", "segments": [
        seg("Picture water in a closed loop of pipe, driven by a pump.", pace=0.93),
        seg("The pump's pressure is like voltage."),
        seg("The water's flow rate is like current."),
        seg("And a narrow section of pipe is like resistance."),
        seg("More pressure, more flow; narrower pipe, less flow.", gap=0.6),
        seg("But here's where the analogy breaks."),
        seg("Cut a water pipe and water spills out; cut a wire and current stops.", gap=0.5),
        seg("And in a pipe, the water carries the energy; in a circuit, energy travels through electric and magnetic fields around the wire.", gap=0.8),
    ], "shots": [
        manim("s07_water", "S07Water", 0),
    ]},

    {"id": "s08", "title": "Ohm's law", "segments": [
        seg("Ohm's law connects all three."),
        seg("For many materials — like a metal wire at steady temperature — current is proportional to voltage: V equals I times R."),
        seg("Memory trick: draw a triangle — V on top, I and R below."),
        seg("Cover what you want."),
        seg("Cover V: I times R."),
        seg("Cover I: V over R."),
        seg("Cover R: V over I.", gap=0.6),
        seg("Example one."),
        seg("An ideal nine-volt battery is connected to a three-ohm resistor."),
        seg("Find the current.", gap=0.5),
        seg("I equals V over R: nine divided by three… three amps.", gap=0.8),
        seg("Example two."),
        seg("A small twelve-volt car bulb draws half an amp."),
        seg("Find its resistance.", gap=0.5),
        seg("R equals V over I: twelve divided by zero point five… twenty-four ohms.", gap=0.9),
    ], "shots": [
        manim("s08_ohm", "S08Law", 0),
        manim("s08_ohm", "S08Examples", 7),
    ]},

    {"id": "s09", "title": "Power & safety", "segments": [
        seg("Bonus formula: power — how fast energy is delivered — equals voltage times current, in watts."),
        seg("Our nine-volt, three-amp circuit? Twenty-seven watts."),
        seg("A kettle on a 230-volt socket draws about ten amps — over two thousand watts.",
            tts="A kettle on a two-hundred-and-thirty-volt socket draws about ten amps — over two thousand watts."),
        seg("Big currents mean big heating, so fuses and breakers cut the power before wires overheat."),
        seg("It's current through your body that harms you — and voltage drives it."),
        seg("As little as a tenth of an amp across the chest can be fatal.", pace=0.88),
        seg("Never poke anything into sockets, keep water away from electricity, and stay clear of fallen power lines.", gap=1.2),
    ], "shots": [
        manim("s09_power", "S09Power", 0),
        footage("kettle_boiling", 2, labels=[label("230 V × 10 A ≈ 2,300 W", 0.6, 4.0, AMBER, "top-left", 64)]),
        photo("breaker_panel", 3, labels=[label("Fuses & breakers cut the power", 0.4, 3.6, CORAL, "top-left", 56)]),
        manim("s09_power", "S09Safety", 4),
    ]},

    {"id": "s10", "title": "Misconceptions", "segments": [
        seg("Let's bust three myths."),
        seg("Myth one: batteries store electrons."),
        seg("They don't — they store chemical energy; the electrons are already in the circuit."),
        seg("Myth two: a bulb uses up current."),
        seg("In a simple loop, the same current flows in and out. What the bulb uses is energy."),
        seg("Myth three: voltage flows. It doesn't."),
        seg("Current flows through things; voltage is across them.", gap=0.8),
    ], "shots": [
        manim("s10_myths", "S10Myths", 0),
    ]},

    {"id": "s11", "title": "Recap + quiz", "segments": [
        seg("Quick recap."),
        seg("Voltage is the push: energy per charge, in volts."),
        seg("Current is the flow: charge per second, in amps."),
        seg("Resistance is the opposition, in ohms."),
        seg("And Ohm's law ties them together: V equals I R.", gap=0.7),
        seg("Your turn — pause if you need to.", pace=0.9),
        seg("One: a twelve-volt battery is connected to a six-ohm resistor. What's the current?"),
        seg("Two: in the water analogy, what does a narrow pipe represent?"),
        seg("Three: true or false — a bulb uses up current.", gap=0.2),
        seg("", silent=5.0, gap=0.2),
        seg("Answers!"),
        seg("One: twelve divided by six — two amps."),
        seg("Two: resistance."),
        seg("Three: false — the current is the same; it's energy that's transferred."),
        seg("Nail all three, and you've got the foundation of every circuit.", gap=0.6),
    ], "shots": [
        manim("s11_quiz", "S11Recap", 0),
        manim("s11_quiz", "S11Quiz", 5),
    ]},

    {"id": "s12", "title": "End card", "fixed": 7.0, "segments": [], "shots": [
        manim("s12_end", "S12End"),
    ]},
]

# Stock media wish list. `kind` is what we want; the fetcher searches these sources in order.
ASSETS = {
    "lightning":      {"kind": "video", "desc": "Slow-motion lightning over a dark landscape",
                       "queries": ["lightning storm night", "lightning slow motion", "thunderstorm lightning"]},
    "city_night":     {"kind": "video", "desc": "Aerial view of city lights at night",
                       "queries": ["city lights night aerial", "night city drone", "city skyline night timelapse"]},
    "phone_charging": {"kind": "video", "desc": "A phone charging on a bedside table",
                       "queries": ["phone charging", "smartphone charging cable", "charging phone"]},
    "copper_wire":    {"kind": "photo", "desc": "Stripped copper wire with plastic insulation",
                       "queries": ["copper wire", "electrical cable copper", "stripped electrical wire"]},
    "aa_batteries":   {"kind": "photo", "desc": "AA batteries, close up",
                       "queries": ["AA batteries", "batteries", "alkaline battery"]},
    "wall_socket":    {"kind": "photo", "desc": "A wall power socket",
                       "queries": ["wall socket", "power outlet", "electrical socket"]},
    "power_lines":    {"kind": "video", "desc": "High-voltage transmission towers and lines",
                       "queries": ["power lines", "high voltage transmission tower", "electricity pylon"]},
    "snail":          {"kind": "video", "desc": "A snail crawling slowly",
                       "queries": ["snail", "snail crawling", "snail macro"]},
    "toaster_glow":   {"kind": "video", "desc": "Glowing red-hot toaster element",
                       "queries": ["toaster heating element", "toaster glowing", "toaster"]},
    "filament_bulb":  {"kind": "video", "desc": "Incandescent bulb filament glowing",
                       "queries": ["light bulb filament", "edison bulb", "incandescent light bulb"]},
    "kettle_boiling": {"kind": "video", "desc": "Electric kettle boiling, steam rising",
                       "queries": ["electric kettle boiling", "kettle steam", "boiling kettle"]},
    "breaker_panel":  {"kind": "photo", "desc": "Household fuse box or breaker panel",
                       "queries": ["circuit breaker panel", "fuse box", "electrical panel"]},
    "ohm_portrait":   {"kind": "photo", "desc": "Portrait of Georg Simon Ohm (public domain)",
                       "queries": ["Georg Simon Ohm"], "sources": ["commons"]},
}
