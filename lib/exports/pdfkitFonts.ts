// pdfkit loads these through "#standard-fonts/*", which the serverless file tracer skips.
// These subpaths are the ones package.json exports; requiring the .cjs files directly throws
// ERR_PACKAGE_PATH_NOT_EXPORTED and takes the whole invoice route down with it.
require("pdfkit/standard-fonts/Courier");
require("pdfkit/standard-fonts/CourierBold");
require("pdfkit/standard-fonts/CourierBoldOblique");
require("pdfkit/standard-fonts/CourierOblique");
require("pdfkit/standard-fonts/Helvetica");
require("pdfkit/standard-fonts/HelveticaBold");
require("pdfkit/standard-fonts/HelveticaBoldOblique");
require("pdfkit/standard-fonts/HelveticaOblique");
require("pdfkit/standard-fonts/Symbol");
require("pdfkit/standard-fonts/TimesBold");
require("pdfkit/standard-fonts/TimesBoldItalic");
require("pdfkit/standard-fonts/TimesItalic");
require("pdfkit/standard-fonts/TimesRoman");
require("pdfkit/standard-fonts/ZapfDingbats");

export {};
