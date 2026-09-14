// Generator-style text tools: lorem ipsum, ASCII banner art, emoji picker, typing
// speed test, SSML builder, braille, morse, roman numerals, binary <-> text.
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import ToolLayout from "../../components/ToolLayout";
import EditorPane from "../../components/EditorPane";
import { CopyButton, Field, NumField, OptionsBar, OutputArea as OutputBox, RunButton, SelField, StatGrid } from "../../components/ui";

// ── Lorem ipsum (shared engine) ──
const LOREM_WORDS =
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(" ");

const HIPSTER_WORDS =
  "artisan craft kombucha aesthetic vinyl typewriter brooklyn sustainable ethical sriracha leggings offal farm-to-table truffaut messenger bag butcher lo-fi selvage portland keffiyeh cold-pressed literally irony mustache asymmetrical gastropub skateboard pop-up cred vegan etsy banjo flannel gentrify".split(" ");

const TECH_WORDS =
  "leverage cloud-native microservice kubernetes blockchain synergy agile pipeline bandwidth endpoint latency throughput datastore schema refactor containerize orchestrate serverless streamline innovate roadmap stakeholder deliverable paradigm scalable robust holistic integrate automate optimize telemetry observability".split(" ");

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 0xffffffff;
  };
}

function generateLorem(style: string, kind: string, count: number, classic: boolean, seed: number): string {
  const words = style === "hipster" ? HIPSTER_WORDS : style === "tech" ? TECH_WORDS : LOREM_WORDS;
  const rand = rng(seed || Date.now());
  const pick = () => words[Math.floor(rand() * words.length)];
  const sentence = (first: boolean, useClassic: boolean) => {
    const n = 6 + Math.floor(rand() * 10);
    const parts: string[] = [];
    for (let i = 0; i < n; i++) {
      const w = useClassic && i < 2 ? LOREM_WORDS[i] : pick();
      parts.push(w);
    }
    const s = parts.join(" ");
    return (first ? s[0].toUpperCase() + s.slice(1) : s) + ".";
  };
  const para = () => {
    const n = 3 + Math.floor(rand() * 4);
    return Array.from({ length: n }, (_, i) => sentence(i === 0, i === 0 && classic)).join(" ");
  };
  if (kind === "paragraphs") return Array.from({ length: count }, para).join("\n\n");
  if (kind === "sentences") return Array.from({ length: count }, (_, i) => sentence(i === 0, i === 0 && classic)).join(" ");
  return Array.from({ length: count }, () => (classic ? LOREM_WORDS[Math.floor(rand() * LOREM_WORDS.length)] : pick())).join(" ");
}

export const LoremTool: ComponentType = () => {
  const [kind, setKind] = useState("paragraphs");
  const [count, setCount] = useState(3);
  const [classic, setClassic] = useState(true);
  const [seed, setSeed] = useState(1);
  const out = useMemo(() => generateLorem("classic", kind, Math.min(50, Math.max(1, count)), classic, seed), [kind, count, classic, seed]);
  return (
    <ToolLayout>
      <OptionsBar>
        <SelField label="Generate" value={kind} onChange={setKind}
          options={[{ value: "paragraphs", label: "Paragraphs" }, { value: "sentences", label: "Sentences" }, { value: "words", label: "Words" }]} />
        <NumField label="How many" value={count} min={1} max={50} onChange={(v) => setCount(v || 3)} />
        <ToggleClassic classic={classic} setClassic={setClassic} />
        <RunButton label="Regenerate" onClick={() => setSeed(Math.floor(Math.random() * 2 ** 31))} />
      </OptionsBar>
      <OutputBox text={out} filename="lorem.txt" rows={10} />
    </ToolLayout>
  );
};

function ToggleClassic({ classic, setClassic }: { classic: boolean; setClassic: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink-muted cursor-pointer">
      <input type="checkbox" checked={classic} onChange={(e) => setClassic(e.target.checked)} className="accent-[var(--color-accent)] w-4 h-4" />
      Start with “Lorem ipsum…”
    </label>
  );
}

export const LoremProTool: ComponentType = () => {
  const [style, setStyle] = useState("classic");
  const [kind, setKind] = useState("paragraphs");
  const [count, setCount] = useState(3);
  const [classic, setClassic] = useState(true);
  const [seed, setSeed] = useState(1);
  const out = useMemo(() => generateLorem(style, kind, Math.min(50, Math.max(1, count)), classic && style === "classic", seed), [style, kind, count, classic, seed]);
  return (
    <ToolLayout>
      <OptionsBar>
        <SelField label="Style" value={style} onChange={setStyle}
          options={[{ value: "classic", label: "Classic Latin" }, { value: "hipster", label: "Hipster" }, { value: "tech", label: "Tech startup" }]} />
        <SelField label="Generate" value={kind} onChange={setKind}
          options={[{ value: "paragraphs", label: "Paragraphs" }, { value: "sentences", label: "Sentences" }, { value: "words", label: "Words" }]} />
        <NumField label="How many" value={count} min={1} max={50} onChange={(v) => setCount(v || 3)} />
        <ToggleClassic classic={classic} setClassic={setClassic} />
        <RunButton label="Regenerate" onClick={() => setSeed(Math.floor(Math.random() * 2 ** 31))} />
      </OptionsBar>
      <OutputBox text={out} filename="placeholder.txt" rows={10} />
    </ToolLayout>
  );
};

// ── ASCII banner art (canvas-rendered, works for any characters) ──
export const AsciiArtTool: ComponentType = () => {
  const [text, setText] = useState("LocalToolBox");
  const [fontPx, setFontPx] = useState(40);
  const [width, setWidth] = useState(80);
  const [charset, setCharset] = useState("█");

  const art = useMemo(() => {
    if (!text.trim()) return "";
    const cols = Math.min(400, Math.max(20, width));
    const canvas = document.createElement("canvas");
    const font = `bold ${fontPx * 4}px "Arial Black", Impact, sans-serif`;
    const probe = canvas.getContext("2d");
    if (!probe) return "";
    probe.font = font;
    const w = Math.ceil(probe.measureText(text).width) + 20;
    const h = Math.ceil(fontPx * 4 * 1.3);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#fff";
    ctx.font = font;
    ctx.textBaseline = "middle";
    ctx.fillText(text, 10, h / 2);
    const data = ctx.getImageData(0, 0, w, h).data;
    const stepX = w / cols;
    const rows = Math.max(6, Math.round((cols / w) * h * (1 / 2.05)));
    const ch: string[] = [...charset].length ? [...charset] : ["#"];
    const lines: string[] = [];
    for (let r = 0; r < rows; r++) {
      let line = "";
      for (let c = 0; c < cols; c++) {
        const x = Math.floor((c + 0.5) * stepX);
        const y = Math.floor(((r + 0.5) / rows) * h);
        const i = (y * w + x) * 4;
        const bright = data[i] / 255;
        if (bright > 0.55) line += ch[0];
        else if (bright > 0.25 && ch.length > 1) line += ch[Math.min(ch.length - 1, 1)];
        else line += " ";
      }
      lines.push(line.replace(/\s+$/, ""));
    }
    return lines.join("\n");
  }, [text, fontPx, width, charset]);

  return (
    <ToolLayout>
      <OptionsBar>
        <Field label="Text">
          <input className="input !w-52" value={text} maxLength={30} onChange={(e) => setText(e.target.value)} />
        </Field>
        <NumField label="Width (chars)" value={width} min={20} max={300} onChange={(v) => setWidth(v || 80)} />
        <NumField label="Thickness" value={fontPx} min={20} max={120} onChange={(v) => setFontPx(v || 40)} />
        <SelField label="Fill characters" value={charset} onChange={setCharset}
          options={[
            { value: "█", label: "Solid blocks" },
            { value: "#", label: "Hashes" },
            { value: "#+=- ", label: "Gradient ASCII" },
            { value: "@%#*+=- ", label: "Full gradient" },
          ]} />
      </OptionsBar>
      <OutputBox text={art} filename="ascii-art.txt" rows={12} />
    </ToolLayout>
  );
};

// ── Emoji picker ──
const EMOJI_RAW = `
😀 grinning happy smile
😃 grinning happy smile big
😄 grinning smiling-eyes happy
😁 beaming grin smile
😆 squinting laugh lol
🤣 rofl rolling laughing lol
😂 tears-of-joy laughing lol
🙂 slight smile
🙃 upside-down silly
😉 winking flirt
😊 smiling blush warm
😇 halo angel innocent
🥰 smiling hearts love adore
😍 heart-eyes love
😘 kiss love
😋 savoring yummy
😜 winking tongue playful
🤪 zany crazy goofy
🤗 hugging hug
🤭 hand-over-mouth giggle
🤫 shushing quiet secret
🤔 thinking hmm consider
😐 neutral meh
😑 expressionless blank
😶 no-mouth silent
😏 smirking smirk
😒 unamused annoyed
🙄 rolling-eyes whatever
😬 grimacing awkward
😌 relieved calm
😔 pensive sad thoughtful
😪 sleepy tired
😴 sleeping zzz tired
😷 medical-mask sick
🤒 thermometer sick fever
🤕 head-bandage hurt injured
🤢 nauseated sick gross
🥵 hot sweating heat
🥶 cold freezing
🥴 woozy dizzy drunk
🤯 exploding-head mind-blown
🥳 partying celebrate party
😎 sunglasses cool
🤓 nerd glasses smart
🧐 monocle inspect
😕 confused puzzled
😟 worried concerned
😮 open-mouth surprised wow
😲 astonished shocked
😳 flushed embarrassed blush
🥺 pleading puppy-eyes
😢 crying tear sad
😭 loudly-crying sobbing sad
😱 screaming fear shock
😖 confounded frustrated
😞 disappointed sad
😩 weary exhausted
🥱 yawning bored sleepy
😤 steam-from-nose determined
😡 enraged angry mad
😠 angry mad
🤬 cursing swearing symbols
😈 devil horns evil
💀 skull dead
💩 poo funny
🤡 clown
👻 ghost spooky halloween
👽 alien ufo
🤖 robot bot ai
🙈 see-no-evil monkey
🙉 hear-no-evil monkey
🙊 speak-no-evil monkey
💋 kiss lipstick
💌 love-letter
💘 heart arrow cupid
💝 heart ribbon gift
💖 sparkling heart
💗 growing heart
💓 beating heart
💞 revolving hearts
💕 two hearts
❤️ red heart love
🧡 orange heart
💛 yellow heart
💚 green heart
💙 blue heart
💜 purple heart
🖤 black heart
🤍 white heart
💔 broken heart sad
💯 hundred points perfect score
💥 collision boom explosion
💫 dizzy star
💦 sweat droplets
💨 dashing wind
💬 speech-bubble chat comment
💭 thought-bubble thinking
🌙 crescent moon night
☀️ sun sunny day
⛅ sun-behind-cloud
🌧️ rain cloud
⛈️ storm lightning rain
🌨️ snow cloud
❄️ snowflake cold winter
⛄ snowman winter
🌈 rainbow colorful
🌊 wave ocean sea
🔥 fire hot flame
✨ sparkles shine magic
⭐ star
🌟 glowing star
⚡ lightning zap voltage
☄️ comet
💪 flexed biceps strong muscle gym
🦾 mechanical-arm robot prosthetic
🧠 brain smart mind
👀 eyes look watch
👋 wave hello hi bye
✋ raised-hand stop high-five
🖖 vulcan spock
👌 ok perfect
✌️ victory peace
🤞 crossed-fingers luck
🤟 love-you fingers
🤘 rock-on metal
🤙 call-me shaka
👉 pointing-right
👈 pointing-left
👆 pointing-up
👇 pointing-down
👍 thumbs-up like yes approve
👎 thumbs-down dislike no
✊ raised-fist power
👊 fist punch bump
👏 clapping applause praise
🙌 raising-hands celebrate
🤝 handshake deal agreement
🙏 folded-hands please pray thanks
🤳 selfie
👶 baby infant
🧒 child kid
👦 boy
👧 girl
🧑 person
👨 man
👩 woman
🧓 older-person
👴 old-man
👵 old-woman
🙅 gesturing-no
🙆 gesturing-ok
🙋 raising-hand volunteer
🤦 facepalm
🤷 shrug idk
👨‍💻 technologist developer coder
👩‍💻 technologist developer coder
👨‍🍳 cook chef
👩‍🍳 cook chef
👨‍🚀 astronaut
👩‍🚀 astronaut
🦸 superhero
🦹 supervillain
🧙 mage wizard witch
🧚 fairy
🧛 vampire
🧜 merperson mermaid
🧝 elf
🧞 genie
🧟 zombie
🏃 running run
🚶 walking walk
🧗 climbing
🏄 surfing
🏊 swimming swim
🚴 biking cycling bike
🏋️ lifting-weights gym workout
🧘 lotus yoga meditate
🍳 cooking egg breakfast
🍿 popcorn movie
🍺 beer drink
🍻 beers cheers
🥂 champagne toast
🍷 wine drink
🍸 cocktail martini
🍹 tropical cocktail
🥤 cup-straw soda
☕ coffee tea
🧋 bubble-tea boba
🍵 green-tea
🥧 pie dessert
🍰 cake dessert
🎂 birthday-cake
🍪 cookie
🍫 chocolate
🍩 doughnut donut
🍭 lollipop candy sweet
🍬 candy sweet
🍎 red-apple fruit
🍏 green-apple fruit
🍐 pear fruit
🍊 orange tangerine fruit
🍋 lemon fruit
🍌 banana fruit
🍉 watermelon fruit
🍇 grapes fruit
🍓 strawberry fruit
🫐 blueberries
🍒 cherries fruit
🍑 peach fruit
🥭 mango fruit
🍍 pineapple fruit
🥥 coconut
🥝 kiwi fruit
🍅 tomato
🥑 avocado
🍔 hamburger burger
🍟 fries fast-food
🍕 pizza
🌭 hot-dog
🌮 taco
🌯 burrito
🥗 salad healthy green
🍝 spaghetti pasta italian
🍜 ramen noodles
🍣 sushi japanese
🍱 bento
🍛 curry rice
🥟 dumpling
🦐 shrimp prawn
🐟 fish
🐠 tropical-fish
🐬 dolphin
🐳 whale
🦈 shark
🐙 octopus
🦀 crab
🐢 turtle tortoise
🐍 snake
🐉 dragon
🦕 dinosaur sauropod
🦖 t-rex dinosaur
🐦 bird
🐧 penguin
🦅 eagle
🦉 owl
🦇 bat
🐺 wolf
🐗 boar
🐴 horse
🦄 unicorn
🐝 bee honey
🦋 butterfly
🐌 snail
🐞 ladybug
🐜 ant
🕷️ spider
🦂 scorpion
🐊 crocodile
🐘 elephant
🦛 hippo
🦏 rhino
🐪 camel
🦒 giraffe
🦘 kangaroo
🐄 cow
🐖 pig
🐏 ram
🐑 sheep
🦙 llama
🐐 goat
🦌 deer
🐕 dog puppy
🐩 poodle
🐈 cat kitten
🐈‍⬛ black-cat
🐓 rooster chicken
🐥 baby-chick
🦆 duck
🦢 swan
🦩 flamingo
🕊️ dove peace
🐇 rabbit bunny
🦝 raccoon
🦨 skunk
🦡 badger
🦫 beaver
🦦 otter
🦥 sloth
🐁 mouse
🐀 rat
🐹 hamster
🐰 rabbit-face bunny
🐶 dog-face puppy
🐱 cat-face kitten
🦊 fox
🐻 bear
🐼 panda
🐨 koala
🐯 tiger-face
🦁 lion
🐮 cow-face
🐷 pig-face
🐸 frog
🐵 monkey-face
🦍 gorilla
🏠 house home
🏡 house-garden home
🏢 office-building
🏥 hospital
🏦 bank
🏫 school
🏭 factory
🏰 castle
🗽 statue-liberty
⛰️ mountain
🌋 volcano
🏔️ snow-mountain
🏕️ camping tent
🏖️ beach
🏜️ desert
🏟️ stadium
🏗️ construction
🎆 fireworks
🎈 balloon party
🎉 party-popper celebrate congrats
🎊 confetti celebrate
🏮 red-lantern china
🧧 red-envelope money
🎁 gift present
🏆 trophy win champion
🥇 gold-medal first
🥈 silver-medal second
🥉 bronze-medal third
⚽ soccer football
🏀 basketball
🏈 american-football
⚾ baseball
🎾 tennis
🏐 volleyball
🎱 pool billiards
🏓 ping-pong table-tennis
🏸 badminton
🥊 boxing glove
🥋 martial-arts karate
🛹 skateboard
⛸️ ice-skate
🎣 fishing
🎯 dart bullseye target
🎮 video-game controller gaming
🕹️ joystick arcade
🎲 dice random
🧩 puzzle piece
🧸 teddy-bear
♠️ spade cards
♥️ heart-suit cards
♦️ diamond-suit cards
♣️ club-suit cards
🖼️ framed-picture art
🎭 theater arts
🎨 artist palette paint
🎤 microphone sing karaoke
🎧 headphones music listen
🎷 saxophone
🎸 guitar music rock
🎹 piano keyboard music
🎺 trumpet
🎻 violin
🥁 drum
🎬 clapper movie film
🎵 musical-note
🎶 musical-notes
💄 lipstick makeup
💻 laptop computer work code
🖥️ desktop computer pc
⌨️ keyboard
🖱️ computer-mouse
🖨️ printer
📱 mobile smartphone phone
☎️ telephone
📞 phone-call
🔋 battery charge
🪫 low-battery
🔌 plug power
💡 light-bulb idea
🔦 flashlight
🕯️ candle
🧯 fire-extinguisher
💸 money-wings spending
💵 dollar money cash
💶 euro money
💷 pound money
💴 yen money
💰 money-bag cash
💳 credit-card payment
💎 gem diamond
⚖️ balance-scale justice
🔗 link chain url
🧰 toolbox tools
🧲 magnet
🧪 test-tube lab experiment
🧬 dna science
🔬 microscope research
🔭 telescope astronomy
📡 satellite-antenna
💉 syringe vaccine
💊 pill medicine
🩺 stethoscope doctor
🚪 door
🛗 elevator
🪞 mirror
🛏️ bed
🛋️ couch sofa
🪑 chair
🚽 toilet
🚿 shower
🛁 bathtub
🧼 soap wash clean
🔍 magnifier search zoom
🔑 key password login
🔐 locked-key secure
🔨 hammer build
⛏️ pickaxe mining
🛠️ hammer-wrench tools fix
🗡️ dagger sword
⚔️ crossed-swords battle
💣 bomb explode
🏹 bow-arrow archery
🛡️ shield defense security
🔧 wrench fix settings
🔩 nut-bolt
⚙️ gear settings config
🚀 rocket launch space
🛸 ufo flying-saucer alien
🚁 helicopter
🚂 locomotive train
🚗 car drive
🚕 taxi
🚌 bus
🏎️ race-car formula
🚓 police-car
🚑 ambulance
🚒 fire-engine
🚚 truck delivery
🚲 bicycle bike
🛴 kick-scooter
🛵 motor-scooter
✈️ airplane flight travel
🛫 takeoff departure
🛬 landing arrival
🪂 parachute skydive
🚢 ship boat
⛵ sailboat
🛶 canoe
⚓ anchor
🚦 traffic-light
🗺️ world-map
🧭 compass navigation
🎄 christmas-tree
🎃 halloween pumpkin
🎅 santa christmas
🕐 one-oclock clock time
🕒 three-oclock clock time
🕕 six-oclock clock time
🕘 nine-oclock clock time
🕛 twelve-oclock clock time
⏰ alarm-clock morning
⌛ hourglass
⌚ watch time
📅 calendar date
⏱️ stopwatch timer
🌡️ thermometer temperature
🌫️ fog mist
🌎 globe-americas earth world
🌍 globe-europe-africa earth world
🌏 globe-asia earth world
🌐 globe internet web
🔮 crystal-ball fortune future
🪄 magic-wand
📺 television tv
📷 camera photo
📸 camera-flash photo
📹 video-camera
💾 floppy-disk save
📀 dvd disc
📐 triangular-ruler
📏 ruler measure
📌 pushpin pin
📍 round-pushpin location
✂️ scissors cut
📝 memo note write
✏️ pencil write edit
📖 open-book read
📚 books library stack
📓 notebook
📄 document page
📰 newspaper news
🏷️ label tag price
🔖 bookmark
🛒 shopping-cart buy grocery
🛍️ shopping-bags
🚫 prohibited no-entry stop
⛔ no-entry
❌ cross wrong no error
✅ check yes done ok
☑️ checkbox checked
⚠️ warning caution
♻️ recycle
❗ exclamation important
❓ question help
🍀 four-leaf-clover luck
⭕ hollow-circle correct
💤 zzz sleep
`;
const EMOJI_DATA: [string, string][] = EMOJI_RAW.trim()
  .split("\n")
  .map((line) => {
    const sp = line.indexOf(" ");
    return [line.slice(0, sp), line.slice(sp + 1)] as [string, string];
  });

export const EmojiPickerTool: ComponentType = () => {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return EMOJI_DATA;
    return EMOJI_DATA.filter(([, kw]) => kw.includes(query));
  }, [q]);
  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <div className="card p-3">
          <input className="input" placeholder="Search emojis by keyword — smile, dog, pizza, rocket…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search emojis" />
          <div className="flex items-center gap-2 mt-3">
            <span className="label !mb-0">Picked</span>
            <div className="flex flex-wrap gap-1 min-h-8 flex-1 items-center">
              {picked.length === 0 && <span className="text-xs text-ink-dim">Click emojis below to collect them here.</span>}
              {picked.map((e, i) => (
                <button key={i} className="text-xl hover:scale-125 transition-transform" title="Click to remove" onClick={() => setPicked((p) => p.filter((_, j) => j !== i))}>
                  {e}
                </button>
              ))}
            </div>
            <CopyButton text={picked.join(" ")} label="Copy all" />
            <button className="btn-ghost !py-1 !px-2 text-xs" onClick={() => setPicked([])}>Clear</button>
          </div>
        </div>
        <div className="card p-3">
          <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(2.4rem, 1fr))" }}>
            {list.map(([emoji, kw], i) => (
              <button
                key={i}
                title={kw}
                className="text-xl h-10 rounded-tool-sm hover:bg-surface-2 flex items-center justify-center transition-colors"
                onClick={() => setPicked((p) => [...p, emoji])}
              >
                {emoji}
              </button>
            ))}
          </div>
          {list.length === 0 && <p className="text-sm text-ink-dim py-4 text-center">No emoji matches “{q}”.</p>}
          <p className="text-[11px] text-ink-dim mt-3">{list.length} shown · click any emoji to add it to your pick list.</p>
        </div>
      </div>
    </ToolLayout>
  );
};

// ── Typing speed test ──
const TYPING_PASSAGES = [
  "The quick brown fox jumps over the lazy dog while the calm river flows beneath the old stone bridge. Typing well is less about speed and more about rhythm; keep your shoulders loose, your wrists floating, and your eyes on the words ahead rather than the keys beneath your fingers.",
  "Programs must be written for people to read, and only incidentally for machines to execute. A clean function name, a well-placed line break, and a comment that explains why instead of what are small gifts to the next person who opens the file, even when that person is you.",
  "LocalToolBox believes your files belong to you alone. Every tool on this site runs inside your browser, on your own machine, without uploading a single byte. Privacy is not a feature to be added later; it is the foundation the whole toolbox stands on.",
];

export const TypingTestTool: ComponentType = () => {
  const [passage, setPassage] = useState(TYPING_PASSAGES[0]);
  const [typed, setTyped] = useState("");
  const [startMs, setStartMs] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [, setTick] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (typed && startMs === null) setStartMs(Date.now());
  }, [typed, startMs]);

  useEffect(() => {
    if (startMs === null || done) return;
    if (typed.length >= passage.length) {
      setDone(true);
      return;
    }
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [startMs, done, typed, passage]);

  const elapsedSec = startMs ? Math.max(1, Math.round((Date.now() - startMs) / 1000)) : 0;

  const correctChars = useMemo(() => {
    let n = 0;
    for (let i = 0; i < typed.length; i++) if (typed[i] === passage[i]) n++;
    return n;
  }, [typed, passage]);

  const wpm = startMs ? Math.round(correctChars / 5 / (elapsedSec / 60)) : 0;
  const accuracy = typed.length ? (correctChars / typed.length) * 100 : 100;

  const reset = (p?: string) => {
    setTyped("");
    setStartMs(null);
    setDone(false);
    if (p !== undefined) setPassage(p);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <ToolLayout>
      <div className="flex flex-col gap-4">
        <OptionsBar>
          <SelField label="Passage" value={passage} onChange={(v) => reset(v)}
            options={TYPING_PASSAGES.map((p, i) => ({ value: p, label: `Passage ${i + 1}` }))} />
          <RunButton label="Restart" onClick={() => reset()} />
        </OptionsBar>
        <div className="card p-4 font-mono text-[15px] leading-7 whitespace-pre-wrap" aria-label="Passage to type">
          {passage.split("").map((ch, i) => {
            const state = i < typed.length ? (typed[i] === ch ? "ok" : "bad") : i === typed.length ? "cur" : "todo";
            return (
              <span
                key={i}
                className={
                  state === "ok" ? "text-ink" : state === "bad" ? "text-danger bg-danger/15" : state === "cur" ? "text-accent border-b-2 border-accent" : "text-ink-dim"
                }
              >
                {ch}
              </span>
            );
          })}
        </div>
        <textarea
          ref={inputRef}
          className="textarea"
          rows={4}
          value={typed}
          placeholder="Start typing here — the timer starts with your first keystroke…"
          onChange={(e) => setTyped(e.target.value.slice(0, passage.length))}
          disabled={done}
          aria-label="Typing input"
        />
        <StatGrid
          items={[
            { label: "WPM", value: startMs ? wpm : "—", strong: true },
            { label: "Accuracy", value: `${accuracy.toFixed(0)}%`, strong: true },
            { label: "Progress", value: `${Math.min(100, (typed.length / passage.length) * 100).toFixed(0)}%` },
            { label: "Elapsed", value: startMs ? `${elapsedSec}s` : "—" },
          ]}
        />
        {done && (
          <div className="card p-4 text-sm">
            <strong className="text-success">Done!</strong> You typed at{" "}
            <strong>{wpm} WPM</strong> with <strong>{accuracy.toFixed(0)}% accuracy</strong> in {elapsedSec} seconds.{" "}
            <button className="link" onClick={() => reset()}>Try again</button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

// ── SSML builder ──
export const SsmlTool: ComponentType = () => {
  const [text, setText] = useState("Welcome to LocalToolBox. Take a moment; your files never leave this device.");
  const [rate, setRate] = useState(100);
  const [pitch, setPitch] = useState(100);
  const [volume, setVolume] = useState(100);
  const [lang, setLang] = useState("en-US");
  const [voice, setVoice] = useState("");
  const [breakSec, setBreakSec] = useState(0);

  const ssml = useMemo(() => {
    const attrs: string[] = [];
    if (rate !== 100) attrs.push(`rate="${rate > 100 ? "+" : ""}${rate - 100}%"`);
    if (pitch !== 100) attrs.push(`pitch="${pitch > 100 ? "+" : ""}${pitch - 100}%"`);
    if (volume !== 100) attrs.push(`volume="${volume > 100 ? "+" : ""}${volume - 100}%"`);
    const prosodyOpen = attrs.length ? `<prosody ${attrs.join(" ")}>` : "";
    const prosodyClose = attrs.length ? "</prosody>" : "";
    const voiceOpen = voice ? `<voice name="${voice.replace(/"/g, "")}">` : "";
    const voiceClose = voice ? "</voice>" : "";
    const brk = breakSec > 0 ? `<break time="${breakSec}s"/>` : "";
    const inner = text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    return `<speak version="1.0" xml:lang="${lang}">\n  ${voiceOpen}${prosodyOpen}${inner}${brk}${prosodyClose}${voiceClose}\n</speak>`;
  }, [text, rate, pitch, volume, lang, voice, breakSec]);

  return (
    <ToolLayout>
      <OptionsBar>
        <NumField label="Rate %" value={rate} min={50} max={200} step={5} onChange={setRate} />
        <NumField label="Pitch %" value={pitch} min={50} max={150} step={5} onChange={setPitch} />
        <NumField label="Volume %" value={volume} min={0} max={100} step={5} onChange={setVolume} />
        <NumField label="Pause after (s)" value={breakSec} min={0} max={10} onChange={(v) => setBreakSec(Math.max(0, v || 0))} />
        <SelField label="Language" value={lang} onChange={setLang}
          options={["en-US", "en-GB", "es-ES", "fr-FR", "de-DE", "it-IT", "pt-BR", "ja-JP", "ko-KR", "zh-CN"].map((l) => ({ value: l, label: l }))} />
        <Field label="Voice name (optional)">
          <input className="input !w-44" value={voice} onChange={(e) => setVoice(e.target.value)} placeholder="e.g. Jenny" />
        </Field>
      </OptionsBar>
      <EditorPane value={text} onChange={setText} output={ssml} inputLabel="Spoken text" outputLabel="SSML" filename="speech.ssml" rows={8}
        sample="Hello! This markup controls how a speech engine reads the text." />
    </ToolLayout>
  );
};

// ── Braille (Grade 1) ──
const BRAILLE: Record<string, string> = {
  " ": "⠀", "!": "⠖", '"': "⠶", "#": "⠼", "'": "⠄", "(": "⠦", ")": "⠴", ",": "⠂", "-": "⠤", ".": "⠲", "/": "⠌",
  "0": "⠚", "1": "⠁", "2": "⠃", "3": "⠉", "4": "⠙", "5": "⠑", "6": "⠋", "7": "⠛", "8": "⠓", "9": "⠊",
  ":": "⠒", ";": "⠆", "?": "⠦", a: "⠁", b: "⠃", c: "⠉", d: "⠙", e: "⠑", f: "⠋", g: "⠛", h: "⠓", i: "⠊", j: "⠚",
  k: "⠅", l: "⠇", m: "⠍", n: "⠝", o: "⠕", p: "⠏", q: "⠟", r: "⠗", s: "⠎", t: "⠞", u: "⠥", v: "⠧", w: "⠺",
  x: "⠭", y: "⠽", z: "⠵",
};
const BRAILLE_REV: Record<string, string> = Object.fromEntries(Object.entries(BRAILLE).map(([a, b]) => [b, a]));

export const BrailleTool: ComponentType = () => {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [text, setText] = useState("");
  const out = useMemo(() => {
    if (mode === "encode") return [...text.toLowerCase()].map((c) => BRAILLE[c] ?? "").join("");
    return [...text].map((c) => BRAILLE_REV[c] ?? "").join("");
  }, [text, mode]);
  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} output={out} rows={8} sample="hello braille" filename="braille.txt"
        options={<OptionsBar><SelField label="Direction" value={mode} onChange={setMode} options={[{ value: "encode", label: "Text → Braille" }, { value: "decode", label: "Braille → Text" }]} /></OptionsBar>} />
    </ToolLayout>
  );
};

// ── Morse ──
const MORSE: Record<string, string> = {
  a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.", h: "....", i: "..", j: ".---",
  k: "-.-", l: ".-..", m: "--", n: "-.", o: "---", p: ".--.", q: "--.-", r: ".-.", s: "...", t: "-",
  u: "..-", v: "...-", w: ".--", x: "-..-", y: "-.--", z: "--..", "0": "-----", "1": ".----", "2": "..---",
  "3": "...--", "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "!": "-.-.--", "/": "-..-.", "@": ".--.-.", "-": "-....-",
  "(": "-.--.", ")": "-.--.-", "&": ".-...", ":": "---...", ";": "-.-.-.", "=": "-...-", "+": ".-.-.",
  "_": "..--.-", '"': ".-..-.", "'": ".----.",
};
const MORSE_REV: Record<string, string> = Object.fromEntries(Object.entries(MORSE).map(([a, b]) => [b, a]));

export const MorseTool: ComponentType = () => {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [text, setText] = useState("");
  const out = useMemo(() => {
    if (mode === "encode") {
      return [...text.toLowerCase()].map((c) => (c === " " ? "/" : MORSE[c] ?? "")).filter(Boolean).join(" ");
    }
    return text
      .trim()
      .split(/\s+/)
      .map((code) => (code === "/" ? " " : MORSE_REV[code] ?? ""))
      .join("");
  }, [text, mode]);
  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} output={out} rows={8} sample="sos local toolbox" filename="morse.txt"
        options={<OptionsBar><SelField label="Direction" value={mode} onChange={setMode} options={[{ value: "encode", label: "Text → Morse" }, { value: "decode", label: "Morse → Text" }]} /></OptionsBar>} />
    </ToolLayout>
  );
};

// ── Roman numerals ──
const ROMAN_PAIRS: [number, string][] = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
  [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];
function toRoman(n: number): string {
  if (n <= 0 || n > 3999) throw new Error("Number must be between 1 and 3999.");
  let out = "";
  for (const [v, s] of ROMAN_PAIRS) while (n >= v) { out += s; n -= v; }
  return out;
}
function fromRoman(s: string): number {
  const val: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  const up = s.toUpperCase();
  if (!/^[IVXLCDM]+$/.test(up)) throw new Error("Enter a valid Roman numeral (letters I, V, X, L, C, D, M only).");
  let total = 0;
  for (let i = 0; i < up.length; i++) {
    const cur = val[up[i]];
    const next = val[up[i + 1]] ?? 0;
    total += cur < next ? -cur : cur;
  }
  if (total <= 0) throw new Error("That is not a valid Roman numeral.");
  return total;
}

export const RomanTool: ComponentType = () => {
  const [mode, setMode] = useState<"toRoman" | "fromRoman">("toRoman");
  const [text, setText] = useState("");
  const { out, err } = useMemo(() => {
    const input = text.trim();
    if (!input) return { out: "", err: null as string | null };
    try {
      if (mode === "toRoman") {
        const n = Number(input);
        if (!Number.isInteger(n)) throw new Error("Enter a whole number (1–3999).");
        return { out: toRoman(n), err: null };
      }
      return { out: String(fromRoman(input)), err: null };
    } catch (e) {
      return { out: "", err: e instanceof Error ? e.message : String(e) };
    }
  }, [text, mode]);
  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} output={out} error={err} rows={4} sample={mode === "toRoman" ? "2026" : "MMXXVI"} filename="roman.txt"
        options={<OptionsBar><SelField label="Direction" value={mode} onChange={setMode} options={[{ value: "toRoman", label: "Number → Roman" }, { value: "fromRoman", label: "Roman → Number" }]} /></OptionsBar>} />
    </ToolLayout>
  );
};

// ── Binary <-> text ──
export const BinaryTool: ComponentType = () => {
  const [mode, setMode] = useState<"toBinary" | "toText">("toBinary");
  const [sep, setSep] = useState<"space" | "none">("space");
  const [text, setText] = useState("");
  const { out, err } = useMemo(() => {
    const input = text.trim();
    if (!input) return { out: "", err: null as string | null };
    try {
      if (mode === "toBinary") {
        const bytes = new TextEncoder().encode(text);
        return { out: [...bytes].map((b) => b.toString(2).padStart(8, "0")).join(sep === "space" ? " " : ""), err: null };
      }
      const bits = input.replace(/[^01]/g, "");
      if (bits.length === 0 || bits.length % 8 !== 0) throw new Error("Binary input must be 0s and 1s in multiples of 8 bits.");
      const bytes = new Uint8Array(bits.length / 8);
      for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
      return { out: new TextDecoder("utf-8", { fatal: false }).decode(bytes), err: null };
    } catch (e) {
      return { out: "", err: e instanceof Error ? e.message : String(e) };
    }
  }, [text, mode, sep]);
  return (
    <ToolLayout>
      <EditorPane value={text} onChange={setText} output={out} error={err} rows={6} sample={mode === "toBinary" ? "Hi!" : "01001000 01101001 00100001"} filename={mode === "toBinary" ? "binary.txt" : "text.txt"}
        options={
          <OptionsBar>
            <SelField label="Direction" value={mode} onChange={setMode} options={[{ value: "toBinary", label: "Text → Binary" }, { value: "toText", label: "Binary → Text" }]} />
            <SelField label="Byte separator" value={sep} onChange={setSep} options={[{ value: "space", label: "Space" }, { value: "none", label: "None" }]} />
          </OptionsBar>
        } />
    </ToolLayout>
  );
};
