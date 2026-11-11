/*
  Founders Club — site settings
  ------------------------------------------------------------
  Edit the values below to update details everywhere on the site.
  Leave a value as "" (empty) if it isn't confirmed yet — the site
  adjusts so nothing looks like a working link when it isn't.
*/
window.FC_CONFIG = {
  // Online sign-up form (e.g. a Google Form link).
  // While this is "", the Join buttons scroll to the "Get involved" section,
  // which tells students to come to a meeting. Once set, they open the form.
  joinUrl: "",

  // Public contact email for mentors, speakers, and staff.
  // While this is "", the site points people to Instagram / Room 0108 instead.
  contactEmail: "",

  // Instagram. Set both to "" to hide every Instagram link.
  instagramUrl: "https://www.instagram.com/bellevue_foundersclub/",
  instagramHandle: "@bellevue_foundersclub",

  // Real photos from meetings. The "At meetings" section stays hidden while
  // this list is empty. Put image files in an images/ folder, e.g.
  //   { src: "images/meeting-1.jpg", alt: "Two members testing an app prototype", caption: "" },
  photos: [],

  // Board members, shown in this order in the "Board" section.
  // Put headshots in images/board/ and set photo to the file path.
  // Headshots are cropped to a 4:5 portrait. While photo is "" (or the file
  // is missing), the card shows a blank tile.
  // Leave role "" to hide it. The section stays hidden while this list is empty.
  board: [
    { name: "Neil Kumar", role: "Co-President", photo: "images/board/neil-kumar.jpg" },
    { name: "Arham Bhandari", role: "Co-President", photo: "images/board/arham-bhandari.jpg" },
    // No headshot yet: add images/board/<first-last>.jpg and set photo to it.
    { name: "Hugo Kim", role: "Vice President", photo: "" },
    { name: "Ella Xu", role: "Secretary", photo: "images/board/ella-xu.jpg" },
    { name: "Ethan Chan", role: "Treasurer", photo: "" },
    { name: "Harin Kim", role: "Social Media", photo: "images/board/harin-kim.jpg" },
    { name: "Lexi Kura", role: "Outreach", photo: "" },
    { name: "Hugo Ng", role: "Technology Lead", photo: "" },
  ],

  meeting: {
    cadence: "Every other Thursday",
    start: "3:30 p.m.",
    end: "",               // e.g. "4:30 p.m." — leave "" until confirmed
    room: "Room 0108",
    host: "Mr. Hong",      // shown next to the room; "" to hide
    school: "Bellevue High School",
  },
};
