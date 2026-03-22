# Neena Kalra - RealScout & Web Data Extraction Report

**Date:** 2026-03-22
**Source URLs Attempted:** 15+ URL variations

---

## Agent Profile Data (Successfully Extracted)

| Field | Value |
|-------|-------|
| **Name** | Neena Kalra |
| **Phone** | (571) 277-2336 |
| **Email** | neenakhomes@kw.com |
| **License** | #0225221074 |
| **Brokerage** | Samson Properties - Chantilly |
| **Office Address** | 14399 Penrose Pl., Suite 300, Chantilly, VA 20151 |
| **Agent ID (RealScout)** | 273757 |
| **Service Areas** | Fairfax, Loudoun, and Prince William Counties, VA |
| **Residence** | Aldie, VA |
| **Experience** | Full-time since 2016 (over a decade) |
| **MLS** | Bright MLS |
| **Team** | TRB - Team Ram Bala |
| **Instagram** | @neenakhomes |
| **Facebook** | Neenakalrarealestate |
| **Website** | neenakhomes.com (redirects to neenakalra.samson-properties.com) |

---

## Agent Photo URLs

| Photo | URL |
|-------|-----|
| Profile Photo (small) | `https://d1buiexcd5gara.cloudfront.net/agents/agent_photos/000/273/757/small/Neena's_profile_pic.jpg?1739672184` |
| Bio Image (full) | `https://d1buiexcd5gara.cloudfront.net/landing_pages/bio_images/000/163/056/original/Cropped_Neena's_profile_pic_without_background.jpg` |
| Brokerage Logo | `https://d1buiexcd5gara.cloudfront.net/brokerage_logos/logo_pictures/000/002/378/large/samson_properties_400x100.png` |

---

## Listing Data Found (From Web Search Results)

Only 3 listings were found via search engine indexing:

### Listing 1
| Field | Value |
|-------|-------|
| **Address** | 628 Black Bear Road |
| **City/State** | Maurertown, VA |
| **Price** | $795,000 |
| **Beds** | 3 |
| **Baths** | 3 |
| **Status** | Unknown |

### Listing 2
| Field | Value |
|-------|-------|
| **Address** | 14000 Grumble Jones Ct, Unit B |
| **City/State** | Centreville, VA 20121 |
| **Price** | $419,000 |
| **Beds** | 2 |
| **Baths** | 1 |
| **Status** | Unknown |

### Listing 3
| Field | Value |
|-------|-------|
| **Address** | 25102 Cypress Mill Terrace |
| **City/State** | Aldie, VA 20105 |
| **Price** | $3,000/month (rental) |
| **Beds** | 4 |
| **Baths** | 5 |
| **Status** | Rental |

**Note:** No photo URLs, sqft, or MLS numbers were found for these listings.

---

## Samson Properties Site Configuration Data

The following was found in the Chime/Lofty-powered Samson Properties site configuration:

- **Featured Listings Search ID:** `xQKAH_1EKOeH`
- **Site Platform:** Lofty (formerly Chime)
- **CDN Domain:** `cdn.lofty.com` and `cdn.chime.me`
- **Available Pages:** `/listing`, `/featured-listing`, `/sold-listing`, `/sell`, `/evaluation`, `/about`, `/contact`, `/reviews`, `/snapshot`, `/owner`

---

## URLs Attempted & Results

| URL | Status |
|-----|--------|
| `https://neenakalra.realscout.me/` | 200 - Agent profile only, no listings (JS-rendered) |
| `https://neenakalra.realscout.me/listings` | 404 |
| `https://neenakalra.realscout.me/listings/active` | 404 |
| `https://neenakalra.realscout.me/listings/sold` | 404 |
| `https://neenakalra.realscout.me/agent/listings` | 404 |
| `https://neenakalra.realscout.me/agent/website` | 404 |
| `https://neenakalra.realscout.me/api/listings` | 404 |
| `https://neenakalra.realscout.me/api/properties` | 404 |
| `https://neenakalra.samson-properties.com/` | 200 - Config only, no listings (JS-rendered) |
| `https://neenakalra.samson-properties.com/listing` | 200 - Config only, no listings (JS-rendered) |
| `https://neenakalra.samson-properties.com/featured-listing` | 200 - Config only, no listings (JS-rendered) |
| `https://neenakalra.samson-properties.com/sold-listing` | 200 - Config only, no listings (JS-rendered) |
| `https://em.realscout.com/widgets/listings?agent_id=273757` | 404 |
| `https://em.realscout.com/agents/273757/listings` | 404 |
| `https://www.realscout.com/agents/273757/listings` | 404 |
| `https://api.realscout.com/v1/agents/273757/listings` | 404 |
| `https://www.homegoogler.com/agents/Neena-Kalra/8484400` | 200 - Config only (same Lofty platform) |
| `https://www.nestfully.com/AgentSearch/NeenaKalra-13394205` | 403 |

---

## Why Full Listing Data Could Not Be Extracted

Both the RealScout site (`neenakalra.realscout.me`) and the Samson Properties site (`neenakalra.samson-properties.com`) are **Single Page Applications (SPAs)** that load listing data dynamically via JavaScript after the page renders:

1. **RealScout** uses `em.realscout.com/assets/em/v3/all.js` to load listing widgets client-side. The HTML source contains only the agent profile and a shell for the listings widget. Actual property data is fetched via authenticated API calls after page load.

2. **Samson Properties (Lofty/Chime platform)** returns only JSON configuration/template data in the HTML. Property listings are fetched via client-side API calls that require browser execution.

3. **No server-rendered listing data** exists in any page source - no JSON-LD schema markup, no `__NEXT_DATA__`, no inline property JSON, no meta tags with listing info.

4. **RealScout has no public API** - their API is private/authenticated and not documented publicly.

5. **Third-party aggregators** (Zillow, Realtor.com, Redfin, Homes.com) all block server-side scraping with 403 errors.

---

## Recommendations for Getting Full Listing Data

1. **Browser automation (Puppeteer/Playwright):** Use a headless browser to load `neenakalra.samson-properties.com/listing` and `neenakalra.samson-properties.com/sold-listing`, wait for JS to render, then extract the DOM content.

2. **Bright MLS RESO API:** If you have Bright MLS API access, query listings where `ListAgentKey` matches Neena Kalra's agent ID.

3. **RealScout widget embed:** Embed the RealScout widget (`em.realscout.com`) in a local HTML page with agent_id=273757, render it in a browser, and capture the network requests to find the actual API endpoints being called.

4. **Manual data entry:** Visit the sites in a browser and manually record the listing data.
