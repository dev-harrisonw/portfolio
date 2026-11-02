// pdfkit loads these through "#standard-fonts/*", which the serverless file tracer skips.
// Requiring them here, and keeping the requires external in next.config.js, copies the files
// into the function so invoice and timesheet PDFs can open Helvetica.
require("pdfkit/js/standard-fonts/Courier.cjs");
require("pdfkit/js/standard-fonts/CourierBold.cjs");
require("pdfkit/js/standard-fonts/CourierBoldOblique.cjs");
require("pdfkit/js/standard-fonts/CourierOblique.cjs");
require("pdfkit/js/standard-fonts/Helvetica.cjs");
require("pdfkit/js/standard-fonts/HelveticaBold.cjs");
require("pdfkit/js/standard-fonts/HelveticaBoldOblique.cjs");
require("pdfkit/js/standard-fonts/HelveticaOblique.cjs");
require("pdfkit/js/standard-fonts/Symbol.cjs");
require("pdfkit/js/standard-fonts/TimesBold.cjs");
require("pdfkit/js/standard-fonts/TimesBoldItalic.cjs");
require("pdfkit/js/standard-fonts/TimesItalic.cjs");
require("pdfkit/js/standard-fonts/TimesRoman.cjs");
require("pdfkit/js/standard-fonts/ZapfDingbats.cjs");

export {};
