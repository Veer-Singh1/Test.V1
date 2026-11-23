/**
 * Marginalia — all facts, roles, years and quotes live in this file.
 *
 * Every fact carries the URL it was checked against (in a `source` field and/or a comment).
 * Quotes are kept short and only used where a primary or reputable source exists.
 * Checked: 23 Nov 2026.
 *
 * Primary references:
 *  - Wikipedia, "Emma Watson": https://en.wikipedia.org/wiki/Emma_Watson
 *  - UN Women speech transcript (20 Sep 2014):
 *    https://www.unwomen.org/en/news/stories/2014/9/emma-watson-gender-equality-is-your-issue-too
 */

export const WIKI = 'https://en.wikipedia.org/wiki/Emma_Watson';
export const UN_WOMEN_SPEECH =
  'https://www.unwomen.org/en/news/stories/2014/9/emma-watson-gender-equality-is-your-issue-too';

export const site = {
  title: 'Marginalia',
  subtitle: 'An unofficial reader’s tribute to Emma Watson',
  disclaimer: 'Unofficial fan tribute. Not affiliated with Emma Watson or her representatives.',
  totalPages: 96,
} as const;

/* -------------------------------------------------------------------------- */
/* Chapters                                                                   */
/* -------------------------------------------------------------------------- */

export type PaperState = 'fresh' | 'reversed' | 'aged' | 'ruled';

export interface Chapter {
  id: string;
  numeral: string;
  title: string;
  /** One line, set under the chapter title. Opens a curiosity gap the chapter closes. */
  epigraph: string;
  pages: [number, number];
  paper: PaperState;
}

export const chapters: Chapter[] = [
  { id: 'prologue', numeral: 'I', title: 'Prologue', epigraph: 'Before the roles, a reader.', pages: [5, 14], paper: 'fresh' },
  { id: 'roles', numeral: 'II', title: 'The Roles', epigraph: 'Twenty spines on one shelf. Pull one out.', pages: [15, 38], paper: 'fresh' },
  { id: 'voice', numeral: 'III', title: 'The Voice', epigraph: 'One speech, one invitation.', pages: [39, 52], paper: 'reversed' },
  { id: 'reader', numeral: 'IV', title: 'The Reader', epigraph: 'A shared shelf, and books left for strangers.', pages: [53, 70], paper: 'aged' },
  { id: 'timeline', numeral: 'V', title: 'Timeline', epigraph: 'The same life, drawn as one line.', pages: [71, 88], paper: 'ruled' },
  { id: 'epilogue', numeral: 'VI', title: 'Epilogue', epigraph: 'Every book ends. Good ones leave notes.', pages: [89, 96], paper: 'fresh' },
];

/* -------------------------------------------------------------------------- */
/* Prologue                                                                   */
/* -------------------------------------------------------------------------- */

export const prologue = {
  firstName: 'Emma',
  lastName: 'Watson',
  // Source: https://en.wikipedia.org/wiki/Emma_Watson — "born on April 15, 1990, in Paris, France";
  // "Her first audition took place when she was nine years old … audition a total of eight times";
  // "graduating from Brown University with a bachelor's degree in English literature in May 2014";
  // "In January 2016, Watson started a feminist Goodreads book club: Our Shared Shelf";
  // "partnered with organisations such as Book Fairies and Books on the Underground".
  lead:
    'Born in Paris on 15 April 1990, she was nine at her first audition and grew up on film. Then she went back to the books: a degree in English literature, a book club with a shared shelf, and a habit of leaving novels where a stranger might find them.',
  body: [
    'This is a fan’s book about her, written in the margins. The printed text keeps to what can be checked; every fact carries a source. The red handwriting is just a reader, thinking out loud.',
  ],
  source: WIKI,
};

/* -------------------------------------------------------------------------- */
/* The Roles — the filmography shelf                                          */
/* Films are referred to by title only. No studio artwork, logos or crests.   */
/* -------------------------------------------------------------------------- */

export interface Film {
  title: string;
  year: number;
  role: string;
  note: string;
  source: string;
}

export const films: Film[] = [
  // Source: https://en.wikipedia.org/wiki/Emma_Watson — first professional role; previously only school plays.
  { title: 'Harry Potter and the Philosopher’s Stone', year: 2001, role: 'Hermione Granger', note: 'Her first professional acting role; before it, she had acted only in school plays.', source: WIKI },
  // Source: https://en.wikipedia.org/wiki/Emma_Watson — "A year later, Watson reprised her role as Hermione".
  { title: 'Harry Potter and the Chamber of Secrets', year: 2002, role: 'Hermione Granger', note: 'Back a year later; reviewers noted how the young cast had matured between films.', source: WIKI },
  // Source: https://en.wikipedia.org/wiki/Emma_Watson — more assertive role; Total Film Child Performance of the Year.
  { title: 'Harry Potter and the Prisoner of Azkaban', year: 2004, role: 'Hermione Granger', note: 'A more assertive Hermione, and Total Film’s Child Performance of the Year.', source: WIKI },
  // Source: https://en.wikipedia.org/wiki/Emma_Watson — "Nominated for three awards for Goblet of Fire, Watson won a bronze Otto Award."
  { title: 'Harry Potter and the Goblet of Fire', year: 2005, role: 'Hermione Granger', note: 'Nominated for three awards for this one; she won a bronze Otto Award.', source: WIKI },
  // Source: https://en.wikipedia.org/wiki/Emma_Watson — inaugural National Movie Award for Best Female Performance.
  { title: 'Harry Potter and the Order of the Phoenix', year: 2007, role: 'Hermione Granger', note: 'Won the inaugural National Movie Award for Best Female Performance.', source: WIKI },
  // Source: https://en.wikipedia.org/wiki/Emma_Watson — premiered 15 July 2009, delayed from November 2008.
  { title: 'Harry Potter and the Half-Blood Prince', year: 2009, role: 'Hermione Granger', note: 'Premiered on 15 July 2009, after a delay from November 2008.', source: WIKI },
  // Source: https://en.wikipedia.org/wiki/Emma_Watson — filming 18 Feb 2009 – 12 Jun 2010; two films shot consecutively.
  { title: 'Harry Potter and the Deathly Hallows – Part 1', year: 2010, role: 'Hermione Granger', note: 'Shot back to back with Part 2, from February 2009 to June 2010.', source: WIKI },
  // Source: https://en.wikipedia.org/wiki/Emma_Watson — "The highest-grossing film in the franchise".
  { title: 'Harry Potter and the Deathly Hallows – Part 2', year: 2011, role: 'Hermione Granger', note: 'The last of eight, and the highest-grossing film of the series.', source: WIKI },
  // Source: https://en.wikipedia.org/wiki/Emma_Watson — first non-Potter role, BBC adaptation of Noel Streatfeild's 1936 novel.
  { title: 'Ballet Shoes', year: 2007, role: 'Pauline Fossil', note: 'Her first role outside the series: a BBC adaptation of Noel Streatfeild’s 1936 novel.', source: WIKI },
  // Source: https://en.wikipedia.org/wiki/Emma_Watson — voiced Princess Pea; based on Kate DiCamillo's novel.
  { title: 'The Tale of Despereaux', year: 2008, role: 'Princess Pea (voice)', note: 'A voice role in the animated adaptation of Kate DiCamillo’s novel.', source: WIKI },
  // Source: https://en.wikipedia.org/wiki/Emma_Watson — "In her first post-Potter film … as Lucy, a wardrobe assistant".
  { title: 'My Week with Marilyn', year: 2011, role: 'Lucy', note: 'Her first film after the series, as a wardrobe assistant on a film set.', source: WIKI },
  // Source: https://en.wikipedia.org/wiki/Emma_Watson — Sam; based on Stephen Chbosky's 1999 novel.
  { title: 'The Perks of Being a Wallflower', year: 2012, role: 'Sam', note: 'Adapted by Stephen Chbosky from his own 1999 novel.', source: WIKI },
  // Source: https://en.wikipedia.org/wiki/The_Bling_Ring — sisters Nicki and Sam Moore; based on real Hollywood burglaries.
  { title: 'The Bling Ring', year: 2013, role: 'Nicki', note: 'Sofia Coppola’s film about a real string of Hollywood burglaries.', source: 'https://en.wikipedia.org/wiki/The_Bling_Ring' },
  // Source: https://en.wikipedia.org/wiki/This_Is_the_End — "fictionalized versions of its cast".
  { title: 'This Is the End', year: 2013, role: 'Herself (fictionalised)', note: 'A fictionalised version of herself, in her first comedy.', source: 'https://en.wikipedia.org/wiki/This_Is_the_End' },
  // Source: https://en.wikipedia.org/wiki/Emma_Watson — role as Ila; "physically very demanding".
  { title: 'Noah', year: 2014, role: 'Ila', note: 'Darren Aronofsky’s biblical epic; she called the role “physically very demanding”.', source: WIKI },
  // Source: https://en.wikipedia.org/wiki/Colonia_(film) — "Emma Watson as Lena, a young flight attendant"; 1973 Chilean coup.
  { title: 'Colonia', year: 2015, role: 'Lena', note: 'A flight attendant, in a thriller set during Chile’s 1973 military coup.', source: 'https://en.wikipedia.org/wiki/Colonia_(film)' },
  // Source: https://en.wikipedia.org/wiki/Regression_(film) — Angela, daughter of John Gray; stars Ethan Hawke and Emma Watson.
  { title: 'Regression', year: 2015, role: 'Angela Gray', note: 'Alejandro Amenábar’s psychological thriller, opposite Ethan Hawke.', source: 'https://en.wikipedia.org/wiki/Regression_(film)' },
  // Source: https://en.wikipedia.org/wiki/Emma_Watson — "re-characterised her as an assistant to her inventor father".
  { title: 'Beauty and the Beast', year: 2017, role: 'Belle', note: 'She re-characterised Belle as an assistant to her inventor father.', source: WIKI },
  // Source: https://en.wikipedia.org/wiki/Emma_Watson — Mae Holland; adaptation of Dave Eggers' novel.
  { title: 'The Circle', year: 2017, role: 'Mae Holland', note: 'From Dave Eggers’ novel about a powerful tech company, surveillance and freedom.', source: WIKI },
  // Source: https://en.wikipedia.org/wiki/Emma_Watson — Meg March in Greta Gerwig's adaptation of Louisa May Alcott's novel.
  { title: 'Little Women', year: 2019, role: 'Meg March', note: 'Greta Gerwig’s adaptation of Louisa May Alcott’s novel.', source: WIKI },
];

/** The shelf is ordered by year, which reads as a life rather than a franchise. */
export const filmsByYear = [...films].sort((a, b) => a.year - b.year || films.indexOf(a) - films.indexOf(b));

/* -------------------------------------------------------------------------- */
/* The Voice — HeForShe, 20 September 2014                                    */
/* -------------------------------------------------------------------------- */

export const voice = {
  // Source: https://en.wikipedia.org/wiki/Emma_Watson — "In July 2014, she was appointed a UN Women Goodwill ambassador.
  // That September … delivered an address at UN Headquarters in New York City to launch the UN Women campaign HeForShe,
  // which aims to urge men to advocate for gender equality."
  context: [
    'In July 2014 she was appointed a UN Women Goodwill Ambassador. That September, at United Nations Headquarters in New York, she gave the speech that launched HeForShe, a campaign asking men and boys to stand up for gender equality.',
    'She said she had started questioning gender-based assumptions at eight, when she was called “bossy”. The speech closed with an invitation.',
  ],
  contextSource: WIKI,
  // Quotes — UN Women transcript, "[Check against delivery]", 20 September 2014:
  // https://www.unwomen.org/en/news/stories/2014/9/emma-watson-gender-equality-is-your-issue-too
  quote: 'Gender equality is your issue too.',
  closing: 'If not me, who? If not now, when?',
  attribution: 'HeForShe launch, United Nations Headquarters, New York, 20 September 2014',
  quoteSource: UN_WOMEN_SPEECH,
};

/* -------------------------------------------------------------------------- */
/* The Reader — Our Shared Shelf, book fairies                                 */
/* -------------------------------------------------------------------------- */

export const reader = {
  paragraphs: [
    {
      // Source: https://en.wikipedia.org/wiki/Emma_Watson — Jan 2016, Goodreads, one book per month,
      // first pick My Life on the Road by Steinem; "ceased updates in January 2020".
      text: 'In January 2016 she started Our Shared Shelf, a feminist book club on Goodreads: one book a month, discussed in the last week of it. The first pick was Gloria Steinem’s My Life on the Road. The club stopped updating in January 2020, but its shelf is still open.',
      source: WIKI,
    },
    {
      // Source: https://time.com/4554660/emma-watson-instagram-book-club/ — copies of Mom & Me & Mom on the London Underground;
      // https://www.nzherald.co.nz/entertainment/emma-watson-hid-books-with-hand-written-notes-on-the-underground/3EDP4XCJIBALBB4V4IHKJIQQSE — hand-written notes.
      text: 'That November, working with Books on the Underground, she left copies of Maya Angelou’s Mom & Me & Mom on the London Tube, each with a handwritten note inside.',
      source: 'https://time.com/4554660/emma-watson-instagram-book-club/',
    },
    {
      // Source: https://time.com/4826549/emma-watson-handmaids-tale-books/ — June 2017, 100 copies, Paris, with Book Fairies.
      text: 'In June 2017, with the Book Fairies, she hid one hundred copies of Margaret Atwood’s The Handmaid’s Tale around Paris, the city where she was born.',
      source: 'https://time.com/4826549/emma-watson-handmaids-tale-books/',
    },
  ],
};

export interface ShelfBook {
  title: string;
  author: string;
  note: string;
  source: string;
  sourceLabel: string;
}

export const shelf: ShelfBook[] = [
  // Source: https://en.wikipedia.org/wiki/Emma_Watson and https://fortune.com/2016/01/08/emma-watson-book-club/
  { title: 'My Life on the Road', author: 'Gloria Steinem', note: 'The very first Our Shared Shelf pick, January 2016.', source: WIKI, sourceLabel: 'Wikipedia' },
  // Source: https://www.harpersbazaar.co.uk/uk/culture/culture-news/news/g37829/emma-watson-book-list/ (month reported as March or April 2016)
  { title: 'How to Be a Woman', author: 'Caitlin Moran', note: 'An Our Shared Shelf pick in spring 2016.', source: 'https://www.harpersbazaar.co.uk/uk/culture/culture-news/news/g37829/emma-watson-book-list/', sourceLabel: 'Harper’s Bazaar' },
  // Source: https://www.adweek.com/galleycat/emma-watsons-feminist-book-club-to-read-the-argonauts/119519
  { title: 'The Argonauts', author: 'Maggie Nelson', note: 'Chosen for the club in 2016.', source: 'https://www.adweek.com/galleycat/emma-watsons-feminist-book-club-to-read-the-argonauts/119519', sourceLabel: 'Adweek' },
  // Source: https://www.bustle.com/p/emma-watsons-2016-reading-list-was-filled-with-incredible-feminist-voices-see-the-full-list-26365
  { title: 'Mom & Me & Mom', author: 'Maya Angelou', note: 'The November–December 2016 pick, the one she left on the Tube.', source: 'https://www.bustle.com/p/emma-watsons-2016-reading-list-was-filled-with-incredible-feminist-voices-see-the-full-list-26365', sourceLabel: 'Bustle' },
  // Source: https://time.com/4826549/emma-watson-handmaids-tale-books/
  { title: 'The Handmaid’s Tale', author: 'Margaret Atwood', note: 'The club’s pick in June 2017, the month of the Paris book drop.', source: 'https://time.com/4826549/emma-watson-handmaids-tale-books/', sourceLabel: 'TIME' },
  // Source: https://bookriot.com/?p=154765 — Book Riot, "Emma Watson Picks Terese Marie Mailhot's HEART BERRIES for Her Book Club" (2018)
  { title: 'Heart Berries', author: 'Terese Marie Mailhot', note: 'A memoir picked for the shared shelf in 2018.', source: 'https://bookriot.com/?p=154765', sourceLabel: 'Book Riot' },
];

/* -------------------------------------------------------------------------- */
/* Timeline                                                                   */
/* -------------------------------------------------------------------------- */

export interface Milestone {
  year: number;
  when?: string;
  title: string;
  text: string;
  source: string;
}

export const milestones: Milestone[] = [
  // Source: https://en.wikipedia.org/wiki/Emma_Watson
  { year: 1990, when: '15 April', title: 'Born in Paris', text: 'She lives in Maisons-Laffitte until five, then moves to Oxfordshire, England.', source: WIKI },
  // Source: https://en.wikipedia.org/wiki/Emma_Watson — first audition at nine; eight auditions; casting began 1999.
  { year: 1999, title: 'First audition', text: 'Aged nine, found by casting agents through her Oxford theatre teacher. Eight auditions follow.', source: WIKI },
  // Source: https://en.wikipedia.org/wiki/Emma_Watson
  { year: 2001, title: 'First film', text: 'Her first professional role reaches cinemas.', source: WIKI },
  // Source: https://en.wikipedia.org/wiki/Emma_Watson — Ballet Shoes broadcast on Boxing Day.
  { year: 2007, when: 'Boxing Day', title: 'Ballet Shoes', text: 'Her first role outside the series, on the BBC.', source: WIKI },
  // Source: https://en.wikipedia.org/wiki/Emma_Watson — Part 2 released July 2011.
  { year: 2011, when: 'July', title: 'The last of eight', text: 'The final film of the series is released.', source: WIKI },
  // Source: https://en.wikipedia.org/wiki/Emma_Watson
  { year: 2014, when: 'May', title: 'Brown University', text: 'Graduates with a BA in English literature.', source: WIKI },
  // Source: https://en.wikipedia.org/wiki/Emma_Watson
  { year: 2014, when: 'July', title: 'UN Women', text: 'Appointed a UN Women Goodwill Ambassador.', source: WIKI },
  // Source: https://www.unwomen.org/en/news/stories/2014/9/emma-watson-gender-equality-is-your-issue-too
  { year: 2014, when: '20 September', title: 'HeForShe', text: 'Launches the campaign with a speech at UN Headquarters, New York.', source: UN_WOMEN_SPEECH },
  // Source: https://en.wikipedia.org/wiki/Emma_Watson
  { year: 2016, when: 'January', title: 'Our Shared Shelf', text: 'Starts a feminist book club on Goodreads.', source: WIKI },
  // Source: https://time.com/4554660/emma-watson-instagram-book-club/
  { year: 2016, when: 'November', title: 'Books on the Tube', text: 'Leaves copies of Mom & Me & Mom on the London Underground.', source: 'https://time.com/4554660/emma-watson-instagram-book-club/' },
  // Source: https://en.wikipedia.org/wiki/Emma_Watson
  { year: 2017, title: 'Belle', text: 'Stars in Beauty and the Beast.', source: WIKI },
  // Source: https://time.com/4826549/emma-watson-handmaids-tale-books/
  { year: 2017, when: 'June', title: 'Paris, again', text: 'Hides 100 copies of The Handmaid’s Tale around the city.', source: 'https://time.com/4826549/emma-watson-handmaids-tale-books/' },
  // Source: https://en.wikipedia.org/wiki/Emma_Watson
  { year: 2019, title: 'Meg March', text: 'Plays Meg in Greta Gerwig’s Little Women.', source: WIKI },
  // Source: https://en.wikipedia.org/wiki/Emma_Watson — June 2020, youngest board member; served 2020–2023.
  { year: 2020, when: 'June', title: 'Kering’s board', text: 'Joins as its youngest member, an advocate for sustainable fashion, until 2023.', source: WIKI },
  // Source: https://en.wikipedia.org/wiki/Emma_Watson — "began a Master of Studies in creative writing at New College, Oxford in 2023"
  { year: 2023, title: 'Back to writing', text: 'Begins a Master of Studies in creative writing at New College, Oxford.', source: WIKI },
  // Source: https://en.wikipedia.org/wiki/Emma_Watson — "In 2025, she began to pursue a DPhil at The University of Oxford."
  { year: 2025, title: 'A doctorate', text: 'Begins a DPhil at the University of Oxford.', source: WIKI },
];

/* -------------------------------------------------------------------------- */
/* Reader's notes — the handwritten voice. Commentary only, never facts.      */
/* -------------------------------------------------------------------------- */

export const notes = {
  prologue: 'start here',
  roles: 'pull one out ↓',
  rolesIndex: 'or read the index',
  voice: 'read it twice',
  reader: 'imagine finding one',
  timeline: 'a busy year',
  epilogue: 'thank you for reading',
};

/* -------------------------------------------------------------------------- */
/* Colophon                                                                   */
/* -------------------------------------------------------------------------- */

export const typefaces = [
  { name: 'Fraunces', by: 'Undercase Type', license: 'SIL Open Font License 1.1', url: 'https://github.com/undercasetype/Fraunces' },
  { name: 'Hanken Grotesk', by: 'Hanken Design Co.', license: 'SIL Open Font License 1.1', url: 'https://github.com/marcologous/hanken-grotesk' },
  { name: 'Caveat', by: 'Impallari Type', license: 'SIL Open Font License 1.1', url: 'https://github.com/googlefonts/caveat' },
];

export const libraries = [
  { name: 'GSAP', license: 'Standard “no charge” license', url: 'https://gsap.com/licensing/' },
  { name: 'Lenis', license: 'MIT', url: 'https://github.com/darkroomengineering/lenis' },
  { name: 'Vite', license: 'MIT', url: 'https://vite.dev' },
];
