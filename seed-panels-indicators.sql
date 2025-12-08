-- Seed script to populate panels and indicators in Supabase
-- Run this in the Supabase SQL Editor after running complete-database-schema.sql

-- Insert 14 ESG Panels
INSERT INTO public.panels (id, title, category, description, purpose, key_indicators, frameworks, icon) VALUES
('1', 'Climate & GHG Emissions Panel', 'environmental', 'Evaluate completeness of Scope 1-3 data. GRI 305, ISSB S2', 'Evaluate data quality and completeness for carbon accounting and emissions reporting.', 'scope1_tco2e → scope3_cat15_tco2e, total_energy_kwh, percent_renewable_energy', 'GRI 305, ISSB S2, SASB, TCFD Metrics', '🌍'),
('2', 'Energy & Resource Efficiency Panel', 'environmental', 'Assess renewable energy mix and intensity data. ISSB S2', 'Assess renewable energy mix, efficiency initiatives, and energy KPIs.', 'total_energy_kwh, renewable_energy_kwh, percent_renewable_energy', 'GRI 302, SASB "Energy Management"', '⚡'),
('3', 'Targets & Transition Plans Panel', 'environmental', 'Validate targets (base year, net zero year, reduction percentages).', 'Validate targets (base year, net zero year, reduction percentages).', 'net_zero_target_year, base_year, near_term_target_scope12_abs_reduction_pct', 'ISSB S2, TCFD "Strategy"', '🎯'),
('4', 'ESG Governance & Oversight Panel', 'governance', 'Review board-level accountability. GRI 2; TCFD', 'Validate governance mechanisms for ESG strategy and reporting.', 'governance_in_place, board_level_responsible', 'TCFD "Governance", GRI 2, SASB "Leadership & Governance"', '👔'),
('5', 'Risk & Resilience Panel', 'governance', 'Map climate and transition risk handling. TCFD Risk Mgmt.', 'Validate enterprise risk mapping, physical/transition risk handling.', 'risk_assessed_status, risk_location, risk_management_actions', 'TCFD "Risk Management"', '⚠️'),
('6', 'Frameworks & Assurance Panel', 'governance', 'Validate alignment with standards and independent verification.', 'Validate alignment with standards and independent verification.', 'commitment_frameworks, standards_referenced, third_party_validation', 'GRI / ISSB / SASB / TCFD', '✅'),
('7', 'Strategy & Implementation Panel', 'environmental', 'Track sustainability initiatives and actions.', 'Track ongoing and planned sustainability initiatives.', 'completed_initiatives, planned_initiatives, challenges_listed', 'GRI 103, SASB "Activity Metrics"', '📋'),
('8', 'Data Quality & Methodology Panel', 'governance', 'Assess calculation methods and data confidence.', 'Validate calculation methods and tools used.', 'calculation_methodology_notes, tools_or_platforms_used', 'GRI 2-4, ISSB "Measurement guidance"', '📊'),
('9', 'Organizational Profile Panel', 'governance', 'Provide context: sector, geography, workforce, revenue period.', 'Provide context: sector, geography, workforce, revenue period.', 'sector, country_region, employees_fte, revenue_reporting_year', 'GRI 2-1 to 2-7', '🏢'),
('10', 'Social & Workforce Panel (New)', 'social', 'Add social indicators (DEI, training).', 'Add social indicators as they appear in later data (e.g., diversity, training, safety).', 'employees_fte (expand later with DEI, training)', 'GRI 401-404, SASB HR Metrics', '👥'),
('11', 'Supply Chain & Upstream Impacts Panel (New)', 'environmental', 'Validate purchased goods, capital goods, fuel data.', 'Validate upstream Scope 3 categories (purchased goods, capital goods, fuel/energy).', 'scope3_cat1-cat8', 'GRI 308, SASB Supply Chain', '📦'),
('12', 'Downstream & Product Impacts Panel (New)', 'environmental', 'Validate downstream Scope 3 impacts (use phase, end-of-life, investments).', 'Validate downstream Scope 3 impacts (use phase, end-of-life, investments).', 'scope3_cat9-cat15', 'GRI 306, SASB Product Lifecycle', '🔄'),
('13', 'Financial & Market Disclosure Panel (New)', 'governance', 'Review financial linkages of sustainability (revenue, cost of capital).', 'Review financial linkages of sustainability (revenue, cost of capital).', 'revenue_reporting_year, net_zero_target_year, sector', 'ISSB S1, TCFD "Metrics & Targets"', '💰'),
('14', 'Reporting & Disclosure Quality Panel (New)', 'governance', 'Assess reporting completeness, transparency, and quality.', 'Assess reporting completeness, transparency, and quality.', 'reporting_period, extraction_confidence, extraction_notes', 'GRI 102, ISSB S1', '📄')
ON CONFLICT (id) DO NOTHING;

-- Insert Indicators
-- Organizational Profile Panel (Panel 9) indicators
INSERT INTO public.indicators (id, panel_id, title, description, formula_required, unit, frameworks, sector_context, validation_question) VALUES
('9-1', '9', 'Report ID', 'Unique identifier automatically assigned to each sustainability report entry.', false, '-', 'Internal system field', 'All', 'Is the report reference unique and traceable?'),
('9-2', '9', 'Source Filename', 'The name of the original file from which sustainability data was extracted.', false, 'Text', 'Internal', 'All', 'Does the filename reflect the reporting organization and year?'),
('9-3', '9', 'Company Name', 'Registered legal name of the reporting company.', false, 'Text', 'GRI 2-1', 'All', 'Is name correctly captured and consistent with official registration?'),
('9-4', '9', 'Sector', 'The primary industry sector the company operates in.', false, 'Text', 'GRI 2-6 / SASB Industry Classification', 'All', 'Is the sector classification aligned with GRI or SASB taxonomy?'),
('9-5', '9', 'Country / Region', 'Country or region where the organization primarily operates or reports emissions.', false, 'Text', 'GRI 2-1', 'All', 'Does the reported region match the scope of sustainability disclosures?'),
('9-6', '9', 'Reporting Year', 'The calendar or fiscal year for which sustainability data is reported.', false, 'Year (YYYY)', 'GRI 302 / 305', 'All', 'Is the reporting period clearly defined and consistent with previous reports?'),
('9-7', '9', 'Reporting Period (Start-End)', 'The start and end dates defining the report''s coverage period.', false, 'Date range', 'GRI 302 / 305', 'All', 'Is the time coverage complete and aligned with reporting year?'),
('9-8', '9', 'Employees (FTE)', 'Number of full-time equivalent employees during the reporting year.', true, 'Count (FTE)', 'GRI 2-7 / SASB HR Metrics', 'All', 'Does the employee count reflect full-time equivalents, excluding contractors?'),
('9-9', '9', 'Headcount or FTE Basis', 'Whether workforce figures are reported as total headcount or FTE.', false, 'Text (Headcount/FTE)', 'GRI 2-7', 'All', 'Is the measurement basis clearly defined?'),
('9-10', '9', 'Revenue (Reporting Year)', 'Annual revenue reported in the same fiscal year as sustainability disclosures.', true, 'Currency (e.g., GBP, USD)', 'ISSB S1 / GRI 201', 'All', 'Is the financial data aligned with the same period as environmental metrics?')
ON CONFLICT (id) DO NOTHING;

-- Targets & Transition Plans Panel (Panel 3) indicators
INSERT INTO public.indicators (id, panel_id, title, description, formula_required, unit, frameworks, sector_context, validation_question) VALUES
('3-1', '3', 'Net-Zero Target Year', 'The year by which the organization commits to reach net-zero GHG emissions.', false, 'Year (YYYY)', 'ISSB S2 / TCFD Strategy', 'All', 'Is the target year realistic and aligned with science-based targets?'),
('3-2', '3', 'Base Year', 'The baseline year used for comparison in GHG reduction targets.', false, 'Year (YYYY)', 'GRI 305-5 / TCFD Metrics', 'All', 'Is the base year clearly defined and still relevant to current targets?'),
('3-3', '3', 'Near-term Target (Scope 1+2 Reduction %)', 'Percentage reduction target for Scope 1 and 2 emissions by a near-term year.', true, '% Reduction', 'ISSB S2 / TCFD Metrics', 'All', 'Is the near-term target aligned with 1.5°C pathways?'),
('3-4', '3', 'Near-term Target (Scope 3 Reduction %)', 'Percentage reduction target for Scope 3 emissions in near-term period.', true, '% Reduction', 'ISSB S2 / TCFD Metrics', 'All', 'Does the company disclose Scope 3 reduction targets with methodologies?'),
('3-5', '3', 'Intensity Target Value', 'Intensity-based GHG target expressed per unit of output or revenue.', true, 'e.g., tCO2e / £ revenue', 'GRI 305-4', 'All', 'Is the intensity metric consistent with organizational boundaries?'),
('3-6', '3', 'Intensity Target Unit / Denominator', 'The denominator for the intensity metric (e.g., revenue, production).', true, 'Text', 'GRI 305-4', 'All', 'Is the denominator (output or revenue) defined and measurable?'),
('3-7', '3', 'Commitment Frameworks Referenced', 'Climate or sustainability frameworks the company aligns with (e.g., SBTi, UNGC).', false, 'Text', 'GRI 102 / ISSB S2', 'All', 'Are the stated frameworks verifiable and current?')
ON CONFLICT (id) DO NOTHING;

-- ESG Governance & Oversight Panel (Panel 4) indicators
INSERT INTO public.indicators (id, panel_id, title, description, formula_required, unit, frameworks, sector_context, validation_question) VALUES
('4-1', '4', 'Governance in Place', 'Indicates if ESG governance structures are formally established.', false, 'Boolean (Yes/No)', 'TCFD Governance / GRI 2-9', 'All', 'Is governance accountability clearly described?'),
('4-2', '4', 'Board-level Responsibility', 'Whether board or senior management oversees ESG / climate strategy.', false, 'Boolean (Yes/No)', 'TCFD Governance / GRI 2-10', 'All', 'Is there explicit board oversight for climate risks and targets?')
ON CONFLICT (id) DO NOTHING;

-- Risk & Resilience Panel (Panel 5) indicators
INSERT INTO public.indicators (id, panel_id, title, description, formula_required, unit, frameworks, sector_context, validation_question) VALUES
('5-1', '5', 'Risk Assessment Status', 'Status of climate or ESG risk assessment (complete, partial, pending).', false, 'Dropdown (Complete/Partial/None)', 'TCFD Risk Management', 'All', 'Has a risk assessment been conducted within the last 24 months?'),
('5-2', '5', 'Risk Location', 'Geographic or operational areas where material ESG risks are identified.', false, 'Text', 'TCFD Risk Management', 'All', 'Are risks geographically specified and relevant?'),
('5-3', '5', 'Risk Management Actions', 'Description of measures implemented to mitigate identified risks.', false, 'Text', 'TCFD Risk Management', 'All', 'Are mitigation actions clearly linked to identified risks?')
ON CONFLICT (id) DO NOTHING;

-- Energy & Resource Efficiency Panel (Panel 2) indicators
INSERT INTO public.indicators (id, panel_id, title, description, formula_required, unit, frameworks, sector_context, validation_question) VALUES
('2-1', '2', 'Total Energy Consumption (kWh)', 'Total energy consumed by the organization during the reporting period.', true, 'kWh', 'GRI 302-1', 'All', 'Is total energy consumption measured and verified?'),
('2-2', '2', 'Renewable Energy Consumption (kWh)', 'Total renewable energy consumed during the reporting period.', true, 'kWh', 'GRI 302-1', 'All', 'Is renewable energy sourced and certified properly?'),
('2-3', '2', 'Percent Renewable Energy', 'Percentage of total energy sourced from renewables.', true, '%', 'GRI 302-1', 'All', 'Is renewable share accurately calculated from verified energy data?')
ON CONFLICT (id) DO NOTHING;

-- Climate & GHG Emissions Panel (Panel 1) indicators
INSERT INTO public.indicators (id, panel_id, title, description, formula_required, unit, frameworks, sector_context, validation_question) VALUES
('1-1', '1', 'Scope 1 Emissions (tCO2e)', 'Direct GHG emissions from owned or controlled sources.', true, 'tCO2e', 'GRI 305-1 / ISSB S2', 'All', 'Are Scope 1 boundaries aligned with GHG Protocol?'),
('1-2', '1', 'Scope 2 Emissions - Location-Based (tCO2e)', 'Indirect GHG emissions from purchased electricity (location-based).', true, 'tCO2e', 'GRI 305-2 / ISSB S2', 'All', 'Are Scope 2 calculations consistent with market and location-based methods?'),
('1-3', '1', 'Scope 2 Emissions - Market-Based (tCO2e)', 'Indirect GHG emissions using market-based electricity data.', true, 'tCO2e', 'GRI 305-2 / ISSB S2', 'All', 'Does the company disclose RECs or contractual instruments?'),
('1-4', '1', 'Scope 3 Emissions - Purchased Goods & Services (tCO2e)', 'Indirect GHG emissions from purchased goods and services.', true, 'tCO2e', 'GRI 305-3 / ISSB S2', 'Manufacturing / Retail', 'Is supplier data primary or estimated?'),
('1-5', '1', 'Scope 3 Emissions - Capital Goods (tCO2e)', 'Indirect emissions from capital goods purchases.', true, 'tCO2e', 'GRI 305-3', 'Manufacturing', 'Are capital goods included in life cycle boundaries?'),
('1-6', '1', 'Scope 3 Emissions - Upstream Fuel & Energy Activities (tCO2e)', 'Upstream emissions from fuel and energy use.', true, 'tCO2e', 'GRI 305-3', 'Energy', 'Is upstream fuel data from verified energy balances?'),
('1-7', '1', 'Scope 3 Emissions - Upstream Transportation (tCO2e)', 'Emissions from transportation and distribution of goods upstream.', true, 'tCO2e', 'GRI 305-3', 'Logistics / Retail', 'Are logistics partners providing emission factors?'),
('1-8', '1', 'Scope 3 Emissions - Waste (tCO2e)', 'Emissions from waste generated in operations.', true, 'tCO2e', 'GRI 306', 'All', 'Are waste emissions calculated per GHG Protocol guidance?'),
('1-9', '1', 'Scope 3 Emissions - Business Travel (tCO2e)', 'Emissions from employee business travel.', true, 'tCO2e', 'GRI 305-3', 'Services', 'Are travel emissions estimated or tracked from travel providers?'),
('1-10', '1', 'Scope 3 Emissions - Employee Commuting (tCO2e)', 'Emissions from employee commuting and homeworking.', true, 'tCO2e', 'GRI 305-3', 'All', 'Are commuting patterns updated post-COVID hybrid models?'),
('1-11', '1', 'Scope 3 Emissions - Downstream Distribution (tCO2e)', 'Emissions from downstream product logistics and distribution.', true, 'tCO2e', 'GRI 305-3', 'Manufacturing / Retail', 'Are downstream distribution emissions modeled consistently?'),
('1-12', '1', 'Scope 3 Emissions - Product Use (tCO2e)', 'Emissions from the use of sold products.', true, 'tCO2e', 'GRI 305-3', 'Manufacturing / Tech', 'Are use-phase assumptions aligned with product life cycle?'),
('1-13', '1', 'Scope 3 Emissions - Product End of Life (tCO2e)', 'Emissions from product disposal and treatment at end-of-life.', true, 'tCO2e', 'GRI 305-3', 'Manufacturing / Retail', 'Are end-of-life emissions estimated from material composition?')
ON CONFLICT (id) DO NOTHING;

-- Frameworks & Assurance Panel (Panel 6) indicators
INSERT INTO public.indicators (id, panel_id, title, description, formula_required, unit, frameworks, sector_context, validation_question) VALUES
('6-1', '6', 'Standards Referenced', 'Reporting or assurance standards referenced (e.g., GRI, ISSB, SASB).', false, 'Text', 'GRI 102 / ISSB S1', 'All', 'Are referenced standards consistent with claimed frameworks?'),
('6-2', '6', 'Third-Party Validation', 'Indicates if reported data were validated by an independent auditor.', false, 'Boolean (Yes/No)', 'GRI 102-56', 'All', 'Is the validation report publicly available or cited?')
ON CONFLICT (id) DO NOTHING;

-- Strategy & Implementation Panel (Panel 7) indicators
INSERT INTO public.indicators (id, panel_id, title, description, formula_required, unit, frameworks, sector_context, validation_question) VALUES
('7-1', '7', 'Completed Initiatives', 'ESG or decarbonization projects completed during the reporting year.', false, 'Text', 'GRI 103-2', 'All', 'Do completed initiatives link to measurable KPIs?'),
('7-2', '7', 'Planned Initiatives', 'Projects planned for the next reporting cycle.', false, 'Text', 'GRI 103-2', 'All', 'Are planned actions time-bound and measurable?'),
('7-3', '7', 'Challenges Listed', 'Challenges or barriers reported in achieving sustainability goals.', false, 'Text', 'GRI 103-2', 'All', 'Are challenges clearly linked to risk assessment outputs?')
ON CONFLICT (id) DO NOTHING;

-- Data Quality & Methodology Panel (Panel 8) indicators
INSERT INTO public.indicators (id, panel_id, title, description, formula_required, unit, frameworks, sector_context, validation_question) VALUES
('8-1', '8', 'Calculation Methodology Notes', 'Notes describing how data were calculated or estimated.', false, 'Text', 'GRI 102 / ISSB', 'All', 'Are assumptions and emission factors clearly stated?'),
('8-2', '8', 'Tools or Platforms Used', 'Digital tools or software used to calculate or manage data.', false, 'Text', 'GRI 102', 'All', 'Is the calculation tool standardized or proprietary?')
ON CONFLICT (id) DO NOTHING;

-- Reporting & Disclosure Quality Panel (Panel 14) indicators
INSERT INTO public.indicators (id, panel_id, title, description, formula_required, unit, frameworks, sector_context, validation_question) VALUES
('14-1', '14', 'Extraction Confidence (0-1)', 'Confidence score for AI/automated data extraction.', true, '0-1 scale', 'Internal QA Field', 'All', 'Does extraction confidence align with manual verification results?'),
('14-2', '14', 'Extraction Notes', 'Notes describing uncertainty or anomalies during data extraction.', false, 'Text', 'Internal QA Field', 'All', 'Are extraction issues resolved or flagged for review?'),
('14-3', '14', 'Additional Comments', 'Any additional contextual or qualitative information.', false, 'Text', '-', 'All', 'Is commentary relevant to sustainability context?')
ON CONFLICT (id) DO NOTHING;

-- Verify the data was inserted
SELECT 'Panels inserted: ' || COUNT(*) FROM public.panels;
SELECT 'Indicators inserted: ' || COUNT(*) FROM public.indicators;

