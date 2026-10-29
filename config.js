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

  meeting: {
    cadence: "Every other Thursday",
    start: "3:30 p.m.",
    end: "",               // e.g. "4:30 p.m." — leave "" until confirmed
    room: "Room 0108",
    host: "Mr. Hong",      // shown next to the room; "" to hide
    school: "Bellevue High School",
  },
};
