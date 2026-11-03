"use client";

import { useMemo } from "react";
import { useLang } from "@/components/shared/Providers";

/**
 * Strings that only the admin panel uses. They live beside the admin components (rather than in the public
 * dictionaries) so the public bundle never carries them. Each entry is `[English, Telugu]`, so a key can never
 * exist in one language and be missing in the other.
 */
const strings = {
  // shell
  administrator: ["Administrator", "నిర్వాహకులు"],
  expandSidebar: ["Expand sidebar", "సైడ్‌బార్ విస్తరించండి"],
  collapseSidebar: ["Collapse sidebar", "సైడ్‌బార్ కుదించండి"],
  navigation: ["Navigation", "నావిగేషన్"],
  skipToContent: ["Skip to content", "కంటెంట్‌కు వెళ్లండి"],

  // dashboard
  welcomeBack: ["Welcome back", "తిరిగి స్వాగతం"],
  dashboardIntro: ["Here is what is happening on the website today.", "ఈ రోజు వెబ్‌సైట్‌లో జరుగుతున్నది ఇదే."],
  signedInAs: ["Signed in as", "సైన్ ఇన్ అయినవారు"],
  overview: ["Overview", "సారాంశం"],
  totalContent: ["Content items", "కంటెంట్ అంశాలు"],
  livePublished: ["Published", "ప్రచురితం"],
  drafts: ["Drafts", "డ్రాఫ్ట్‌లు"],
  photosLive: ["Photos live", "ప్రచురిత ఫోటోలు"],
  posterDownloads: ["Poster downloads", "పోస్టర్ డౌన్‌లోడ్‌లు"],
  quickActions: ["Quick actions", "త్వరిత చర్యలు"],
  uploadPhotos: ["Upload photographs", "ఫోటోలు అప్‌లోడ్ చేయండి"],
  uploadPhotosHint: ["Add several at once as drafts", "ఒకేసారి అనేకం డ్రాఫ్ట్‌లుగా జోడించండి"],
  createContent: ["Create content", "కంటెంట్ సృష్టించండి"],
  createContentHint: ["Latest update, activity or poster", "తాజా సమాచారం, కార్యక్రమం లేదా పోస్టర్"],
  designPoster: ["Design a poster", "పోస్టర్ రూపొందించండి"],
  designPosterHint: ["Open the poster designer", "పోస్టర్ డిజైనర్ తెరవండి"],
  openWebsite: ["Open the website", "వెబ్‌సైట్ తెరవండి"],
  openWebsiteHint: ["See it as visitors do", "సందర్శకులు చూసేలా చూడండి"],
  recentActivity: ["Recent website activity", "ఇటీవలి వెబ్‌సైట్ కార్యకలాపాలు"],
  recentActivityEmpty: ["Nothing yet", "ఇంకా ఏమీ లేదు"],
  recentActivityHelp: ["Changes you make from now on will be listed here with the time they were made.", "ఇకపై మీరు చేసే మార్పులు వాటి సమయంతో ఇక్కడ కనిపిస్తాయి."],
  created: ["Created", "సృష్టించబడింది"],
  updated: ["Updated", "నవీకరించబడింది"],
  recentPhotos: ["Latest photographs", "తాజా ఫోటోలు"],
  recentPhotosEmpty: ["No photographs uploaded yet", "ఇంకా ఫోటోలు అప్‌లోడ్ చేయలేదు"],
  recentPhotosHelp: ["Upload photographs and the latest ones will appear here.", "ఫోటోలు అప్‌లోడ్ చేస్తే తాజావి ఇక్కడ కనిపిస్తాయి."],
  pendingApprovals: ["Pending gallery approvals", "పెండింగ్ గ్యాలరీ ఆమోదాలు"],
  pendingEmpty: ["Nothing waiting for approval", "ఆమోదం కోసం ఏమీ వేచి లేదు"],
  pendingHelp: ["Every photograph has permission recorded. New uploads wait here until you authorise them.", "ప్రతి ఫోటోకు అనుమతి నమోదైంది. కొత్త అప్‌లోడ్‌లు మీరు ఆమోదించే వరకు ఇక్కడ ఉంటాయి."],
  reviewAll: ["Review all", "అన్నీ సమీక్షించండి"],
  contentStatus: ["Draft and published, by section", "విభాగాల వారీగా డ్రాఫ్ట్ మరియు ప్రచురితం"],
  seeAll: ["See all", "అన్నీ చూడండి"],
  postersByCategory: ["Posters by category", "వర్గాల వారీగా పోస్టర్లు"],
  mostDownloaded: ["Most downloaded posters", "ఎక్కువగా డౌన్‌లోడ్ అయిన పోస్టర్లు"],
  storageMode: ["Storage", "నిల్వ"],
  loadFailed: ["Could not load this information.", "ఈ సమాచారాన్ని లోడ్ చేయలేకపోయాం."],
  retry: ["Try again", "మళ్లీ ప్రయత్నించండి"],
  photoCount: ["{n} photographs", "{n} ఫోటోలు"],
  awaitingPermission: ["Awaiting permission", "అనుమతి కోసం వేచి ఉంది"],
  heldBack: ["Published but held back", "ప్రచురించినా నిలిపివేయబడింది"],
  heldBackHelp: ["{n} published photograph(s) are not public because permission is not authorised.", "అనుమతి లేనందున {n} ప్రచురిత ఫోటో(లు) ప్రజలకు కనిపించవు."],

  // forms and editor
  langBoth: ["Both languages", "రెండు భాషలు"],
  langMode: ["Editing language", "సవరించే భాష"],
  groupContent: ["Content", "కంటెంట్"],
  groupMedia: ["Images", "చిత్రాలు"],
  groupDetails: ["Details and sources", "వివరాలు మరియు ఆధారాలు"],
  groupPublishing: ["Publishing", "ప్రచురణ"],
  requiredField: ["This field is required.", "ఈ వివరం తప్పనిసరి."],
  fixErrors: ["Please fix the highlighted fields.", "హైలైట్ చేసిన వివరాలను సరిచేయండి."],
  dropImage: ["Drop an image here, or", "చిత్రాన్ని ఇక్కడ వదలండి, లేదా"],
  browse: ["browse files", "ఫైళ్లు ఎంచుకోండి"],
  imageRules: ["JPG, PNG or WebP · up to 8 MB", "JPG, PNG లేదా WebP · 8 MB వరకు"],
  tooLarge: ["That file is larger than 8 MB.", "ఆ ఫైల్ 8 MB కంటే పెద్దది."],
  badType: ["Only JPG, PNG or WebP images are allowed.", "JPG, PNG లేదా WebP చిత్రాలు మాత్రమే అనుమతి."],
  imageUploaded: ["Image uploaded", "చిత్రం అప్‌లోడ్ అయింది"],
  duplicateReused: ["This photograph was already uploaded — the existing file was reused.", "ఈ ఫోటో ఇప్పటికే అప్‌లోడ్ అయింది — ఉన్న ఫైల్‌నే ఉపయోగించాం."],
  replaceImage: ["Replace image", "చిత్రం మార్చండి"],
  removeImage: ["Remove image", "చిత్రం తొలగించండి"],
  addAnother: ["Add another image", "మరో చిత్రం జోడించండి"],
  saveDraft: ["Save draft", "డ్రాఫ్ట్‌గా సేవ్ చేయండి"],
  saveAsDraft: ["Save as draft", "డ్రాఫ్ట్‌గా సేవ్ చేయండి"],
  publishNow: ["Publish", "ప్రచురించండి"],
  updateNow: ["Update", "నవీకరించండి"],
  addItem: ["Add new", "కొత్తది చేర్చండి"],
  editItem: ["Edit", "సవరించండి"],
  toastDraftSaved: ["Saved as a draft", "డ్రాఫ్ట్‌గా సేవ్ అయింది"],
  toastPublished: ["Published", "ప్రచురించబడింది"],
  toastUpdated: ["Updated", "నవీకరించబడింది"],
  toastUnpublished: ["Moved back to drafts", "తిరిగి డ్రాఫ్ట్‌లకు మార్చబడింది"],
  toastDeleted: ["Deleted", "తొలగించబడింది"],
  toastReorderFailed: ["Could not save the new order.", "కొత్త క్రమాన్ని సేవ్ చేయలేకపోయాం."],
  discardTitle: ["Discard unsaved changes?", "సేవ్ చేయని మార్పులను వదిలేయాలా?"],
  discardMessage: ["Your edits have not been saved and will be lost.", "మీ మార్పులు సేవ్ కాలేదు; అవి పోతాయి."],
  keepEditing: ["Keep editing", "సవరణ కొనసాగించండి"],
  discard: ["Discard", "వదిలేయండి"],
  deleteTitle: ["Delete this item?", "ఈ అంశాన్ని తొలగించాలా?"],
  deleteMessage: ["“{name}” will be removed permanently. This cannot be undone.", "“{name}” శాశ్వతంగా తొలగించబడుతుంది. దీన్ని వెనక్కి తీసుకోలేరు."],
  deleteMany: ["Delete {n} items?", "{n} అంశాలను తొలగించాలా?"],
  deleteManyMessage: ["They will be removed permanently along with their stored image files, unless another item still uses them.", "వీటిని, మరో అంశం వాడుతున్నవి తప్ప, నిల్వ ఉన్న చిత్ర ఫైళ్లతో సహా శాశ్వతంగా తొలగిస్తాం."],
  deleteAction: ["Delete", "తొలగించండి"],
  unsaved: ["Unsaved changes", "సేవ్ చేయని మార్పులు"],
  searchLabel: ["Search", "శోధన"],
  searchTitles: ["Search by title…", "శీర్షిక ద్వారా వెతకండి…"],
  filterAll: ["All", "అన్నీ"],
  filterPublished: ["Published", "ప్రచురితం"],
  filterDrafts: ["Drafts", "డ్రాఫ్ట్‌లు"],
  noMatches: ["Nothing matches your search", "మీ శోధనకు ఏదీ సరిపోలలేదు"],
  noMatchesHelp: ["Try a different word or clear the filters.", "మరో పదం ప్రయత్నించండి లేదా ఫిల్టర్లను తొలగించండి."],
  clearFilters: ["Clear filters", "ఫిల్టర్లు తొలగించండి"],
  emptyTitle: ["Nothing here yet", "ఇక్కడ ఇంకా ఏమీ లేదు"],
  emptyHelp: ["Add the first item to get started. New items can be saved as drafts and published when they are ready.", "మొదటి అంశాన్ని చేర్చండి. కొత్త అంశాలను డ్రాఫ్ట్‌గా సేవ్ చేసి సిద్ధమైనప్పుడు ప్రచురించవచ్చు."],
  itemsCount: ["{n} items", "{n} అంశాలు"],
  lastEdited: ["Edited {when}", "{when} సవరించబడింది"],
  moveEarlier: ["Move earlier", "ముందుకు జరపండి"],
  moveLater: ["Move later", "వెనక్కి జరపండి"],
  reorderHint: ["Order matters here — it is the order visitors see. Use the arrows to move items.", "ఇక్కడ క్రమం ముఖ్యం — సందర్శకులు చూసే క్రమం ఇదే. బాణాలతో అంశాలను జరపండి."],
  unpublishItem: ["Move to drafts", "డ్రాఫ్ట్‌లకు మార్చండి"],
  publishItem: ["Publish", "ప్రచురించండి"],
  publishBlocked: ["Could not publish", "ప్రచురించలేకపోయాం"],
  loading: ["Loading…", "లోడ్ అవుతోంది…"],
  settingsSaved: ["Settings saved", "సెట్టింగ్‌లు సేవ్ అయ్యాయి"],
  unsavedSettings: ["You have unsaved changes", "సేవ్ చేయని మార్పులు ఉన్నాయి"],
  noChanges: ["All changes saved", "అన్ని మార్పులు సేవ్ అయ్యాయి"],
  signInIntro: ["Sign in to manage the website.", "వెబ్‌సైట్‌ను నిర్వహించడానికి సైన్ ఇన్ చేయండి."],
  backToSite: ["Back to the website", "వెబ్‌సైట్‌కు తిరిగి"],
  showPassword: ["Show password", "పాస్‌వర్డ్ చూపండి"],
  hidePassword: ["Hide password", "పాస్‌వర్డ్ దాచండి"],
  securedNote: ["Private area — authorised administrators only.", "ప్రైవేట్ ప్రాంతం — అధికారిక నిర్వాహకులకు మాత్రమే."],

  // gallery manager
  uploadTitle: ["Upload photographs", "ఫోటోలు అప్‌లోడ్ చేయండి"],
  dragHere: ["Drag photographs here", "ఫోటోలను ఇక్కడికి లాగండి"],
  orChoose: ["or choose files", "లేదా ఫైళ్లు ఎంచుకోండి"],
  addToCategory: ["Add to category", "ఈ వర్గంలో చేర్చండి"],
  uploadNote: ["Photographs are added as drafts awaiting permission. Add the details, mark each one Authorised, then publish.", "ఫోటోలు అనుమతి కోసం వేచి ఉండే డ్రాఫ్ట్‌లుగా చేరతాయి. వివరాలు జోడించి, ప్రతిదాన్ని 'అనుమతి ఉంది' గా గుర్తించి, ప్రచురించండి."],
  qWaiting: ["Waiting", "వేచి ఉంది"],
  qUploading: ["Uploading…", "అప్‌లోడ్ అవుతోంది…"],
  qAdded: ["Added as draft", "డ్రాఫ్ట్‌గా చేరింది"],
  qDuplicate: ["Already in the gallery", "ఇప్పటికే గ్యాలరీలో ఉంది"],
  qFailed: ["Failed", "విఫలమైంది"],
  qProcessed: ["{done} of {total} processed", "{total} లో {done} పూర్తయ్యాయి"],
  qSummary: ["{n} added as drafts", "{n} డ్రాఫ్ట్‌లుగా చేరాయి"],
  retryFailed: ["Retry failed", "విఫలమైనవి మళ్లీ ప్రయత్నించండి"],
  clearList: ["Clear list", "జాబితా తొలగించండి"],
  allCategories: ["All categories", "అన్ని వర్గాలు"],
  statusAll: ["All", "అన్నీ"],
  statusLive: ["Live", "ప్రజలకు కనిపిస్తున్నవి"],
  statusDrafts: ["Drafts", "డ్రాఫ్ట్‌లు"],
  statusPending: ["Awaiting permission", "అనుమతి కోసం వేచి ఉన్నవి"],
  searchPhotos: ["Search by title, caption or credit…", "శీర్షిక, క్యాప్షన్ లేదా క్రెడిట్ ద్వారా వెతకండి…"],
  selectedN: ["{n} selected", "{n} ఎంచుకున్నాయి"],
  selectAll: ["Select all shown", "చూపినవన్నీ ఎంచుకోండి"],
  clearSelection: ["Clear selection", "ఎంపిక తొలగించండి"],
  bulkPublish: ["Publish", "ప్రచురించండి"],
  bulkUnpublish: ["Unpublish", "ప్రచురణ ఆపండి"],
  bulkDone: ["{ok} updated", "{ok} నవీకరించబడ్డాయి"],
  bulkSkipped: ["{fail} skipped — a photograph needs Authorised permission and alt text before it can be published.", "{fail} వదిలేశాం — ప్రచురించాలంటే ఫోటోకు 'అనుమతి ఉంది' స్థితి మరియు alt టెక్స్ట్ ఉండాలి."],
  dragReorder: ["Drag to reorder", "క్రమం మార్చడానికి లాగండి"],
  reorderOn: ["Drag photographs, or use the arrows, to change the order. This is the order visitors see.", "క్రమం మార్చడానికి ఫోటోలను లాగండి లేదా బాణాలు వాడండి. సందర్శకులు చూసే క్రమం ఇదే."],
  reorderOff: ["Reordering is available when no search or filter is active.", "శోధన లేదా ఫిల్టర్ లేనప్పుడు మాత్రమే క్రమం మార్చవచ్చు."],
  previewPhoto: ["Preview", "ప్రివ్యూ"],
  previewHint: ["Preview as visitors will see it", "సందర్శకులకు కనిపించేలా ప్రివ్యూ"],
  badgeLive: ["Live", "ప్రజలకు కనిపిస్తోంది"],
  badgeDraft: ["Draft", "డ్రాఫ్ట్"],
  badgeHeld: ["Held back", "నిలిపివేయబడింది"],
  badgePending: ["Needs permission", "అనుమతి కావాలి"],
  badgeFeatured: ["Featured", "ప్రత్యేకం"],
  badgeDownload: ["Download on", "డౌన్‌లోడ్ అనుమతి"],
  checklist: ["Ready to go live?", "ప్రజలకు కనిపించడానికి సిద్ధమా?"],
  checkTitle: ["Title added", "శీర్షిక ఉంది"],
  checkAlt: ["Alt text added", "Alt టెక్స్ట్ ఉంది"],
  checkPermission: ["Permission marked Authorised", "అనుమతి 'ఉంది' గా గుర్తించారు"],
  checkPublished: ["Set to Published", "ప్రచురితంగా ఉంది"],
  pixelSize: ["{w} × {h} px", "{w} × {h} px"],
  noPhotosTitle: ["No photographs yet", "ఇంకా ఫోటోలు లేవు"],
  noPhotosHelp: ["Drag photographs into the upload area above. Each one is stored safely as a draft, and nothing becomes public until you authorise and publish it.", "పైన ఉన్న అప్‌లోడ్ ప్రాంతంలోకి ఫోటోలను లాగండి. ప్రతిదీ డ్రాఫ్ట్‌గా భద్రంగా నిల్వ అవుతుంది; మీరు అనుమతించి ప్రచురించే వరకు ఏదీ ప్రజలకు కనిపించదు."],
  designerTools: ["Tools", "సాధనాలు"],
  designerProperties: ["Properties", "లక్షణాలు"],
  designerSave: ["Save and share", "సేవ్ మరియు షేర్"],
  designerHelp: ["Click an item on the poster to select it and drag to move it. Arrow keys nudge it (Shift moves 10 px) and Delete removes it.", "పోస్టర్‌పై ఒక అంశాన్ని క్లిక్ చేసి ఎంచుకుని లాగి జరపండి. బాణం కీలతో కొద్దిగా జరపవచ్చు (Shift = 10 px), Delete తో తొలగించవచ్చు."],
  noGalleryPhotos: ["No authorised photographs yet. Upload photographs in the Photo gallery and mark them Authorised to use them here.", "ఇంకా అనుమతి ఉన్న ఫోటోలు లేవు. ఫోటో గ్యాలరీలో అప్‌లోడ్ చేసి 'అనుమతి ఉంది' గా గుర్తిస్తే ఇక్కడ వాడవచ్చు."],
  galleryPhotoPick: ["Authorised gallery photographs", "అనుమతి ఉన్న గ్యాలరీ ఫోటోలు"],
  layerSelected: ["Selected", "ఎంచుకున్నది"],
  exportHint: ["Exports a full-resolution PNG, ready to share.", "షేర్ చేయడానికి సిద్ధంగా పూర్తి రిజల్యూషన్ PNG ఎగుమతి అవుతుంది."],
  posterSavedPublished: ["Saved to Posters and published", "పోస్టర్లలో సేవ్ అయి ప్రచురించబడింది"],
  templateSaved: ["Template saved", "టెంప్లేట్ సేవ్ అయింది"],
  confirmTemplateDelete: ["Delete this template?", "ఈ టెంప్లేట్‌ను తొలగించాలా?"],
  templateName: ["Template name", "టెంప్లేట్ పేరు"],
  yourTemplates: ["Your saved templates", "మీరు సేవ్ చేసిన టెంప్లేట్లు"],
  builtInTemplates: ["Built-in templates", "అంతర్నిర్మిత టెంప్లేట్లు"],
  photosShown: ["{shown} of {total} photographs", "{total} లో {shown} ఫోటోలు"],
} as const satisfies Record<string, readonly [string, string]>;

export type AdminKey = keyof typeof strings;
type Dict = Record<AdminKey, string>;

const dictionaries: Record<"en" | "te", Dict> = {
  en: Object.fromEntries(Object.entries(strings).map(([k, v]) => [k, v[0]])) as Dict,
  te: Object.fromEntries(Object.entries(strings).map(([k, v]) => [k, v[1]])) as Dict,
};

export function useAdminT(): Dict {
  const { lang } = useLang();
  return useMemo(() => dictionaries[lang], [lang]);
}

/** "3 minutes ago" / "3 నిమిషాల క్రితం", falling back to a plain date for anything older than a week. */
export function timeAgo(iso: string, lang: "en" | "te", now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.round((then - now) / 1000);
  const abs = Math.abs(seconds);
  const rtf = new Intl.RelativeTimeFormat(lang === "te" ? "te-IN" : "en-IN", { numeric: "auto" });
  if (abs < 60) return rtf.format(0, "second");
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
  if (abs < 7 * 86400) return rtf.format(Math.round(seconds / 86400), "day");
  return new Date(iso).toLocaleDateString(lang === "te" ? "te-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Replaces `{n}`-style placeholders. */
export function fill(text: string, values: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ""));
}
