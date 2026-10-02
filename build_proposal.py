# -*- coding: utf-8 -*-
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

NAVY = RGBColor(0x1B, 0x2A, 0x41)
TEAL = RGBColor(0x0E, 0x6E, 0x7A)
GREY = RGBColor(0x55, 0x5F, 0x6D)
BLACK = RGBColor(0x1A, 0x1A, 0x1A)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
FONT = "Calibri"

doc = Document()

# ---------- page setup ----------
s = doc.sections[0]
s.page_width, s.page_height = Cm(21.0), Cm(29.7)
s.left_margin = s.right_margin = Cm(2.0)
s.top_margin = Cm(1.8)
s.bottom_margin = Cm(1.8)

# ---------- base styles ----------
n = doc.styles["Normal"]
n.font.name = FONT
n.font.size = Pt(10.5)
n.font.color.rgb = BLACK
n.paragraph_format.space_after = Pt(6)
n.paragraph_format.line_spacing = 1.10
n._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)


def style_heading(name, size, color, before=14, after=6):
    st = doc.styles[name]
    st.font.name = FONT
    st.font.size = Pt(size)
    st.font.bold = True
    st.font.color.rgb = color
    st.paragraph_format.space_before = Pt(before)
    st.paragraph_format.space_after = Pt(after)
    st.paragraph_format.keep_with_next = True


style_heading("Heading 1", 13, NAVY, before=12, after=5)
style_heading("Heading 2", 11, TEAL, before=10, after=4)

for st_name in ("List Bullet", "List Number"):
    st = doc.styles[st_name]
    st.font.name = FONT
    st.font.size = Pt(10.5)
    st.font.color.rgb = BLACK
    st.paragraph_format.space_after = Pt(3)
    st.paragraph_format.line_spacing = 1.10


# ---------- helpers ----------
def shade(cell, hexcolor):
    tcPr = cell._tc.get_or_add_tcPr()
    el = OxmlElement("w:shd")
    el.set(qn("w:val"), "clear")
    el.set(qn("w:color"), "auto")
    el.set(qn("w:fill"), hexcolor)
    tcPr.append(el)


def cell_margins(table, top=40, bottom=40, left=100, right=100):
    tblPr = table._tbl.tblPr
    mar = OxmlElement("w:tblCellMar")
    for tag, val in (("top", top), ("left", left), ("bottom", bottom), ("right", right)):
        e = OxmlElement("w:" + tag)
        e.set(qn("w:w"), str(val))
        e.set(qn("w:type"), "dxa")
        mar.append(e)
    tblPr.append(mar)


def borders(table, color="C9D2DC"):
    tblPr = table._tbl.tblPr
    b = OxmlElement("w:tblBorders")
    for tag in ("top", "left", "bottom", "right", "insideH", "insideV"):
        e = OxmlElement("w:" + tag)
        e.set(qn("w:val"), "single")
        e.set(qn("w:sz"), "4")
        e.set(qn("w:space"), "0")
        e.set(qn("w:color"), color)
        b.append(e)
    tblPr.append(b)


def set_text(cell, text, bold=False, size=9.5, color=BLACK):
    cell.text = ""
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(1)
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.line_spacing = 1.06
    r = p.add_run(text)
    r.font.name = FONT
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.color.rgb = color


def fixed_layout(table, widths_cm):
    """python-docx ignores cell widths unless the layout is fixed and the grid is set."""
    tbl = table._tbl
    tblPr = tbl.tblPr
    layout = OxmlElement("w:tblLayout")
    layout.set(qn("w:type"), "fixed")
    tblPr.append(layout)
    total = OxmlElement("w:tblW")
    total.set(qn("w:w"), str(int(sum(widths_cm) * 567)))
    total.set(qn("w:type"), "dxa")
    tblPr.append(total)
    grid = tbl.find(qn("w:tblGrid"))
    if grid is not None:
        tbl.remove(grid)
    grid = OxmlElement("w:tblGrid")
    for w in widths_cm:
        gc = OxmlElement("w:gridCol")
        gc.set(qn("w:w"), str(int(w * 567)))
        grid.append(gc)
    tbl.insert(list(tbl).index(tblPr) + 1, grid)


def make_table(rows, widths_cm, header=True, zebra=True):
    t = doc.add_table(rows=0, cols=len(widths_cm))
    t.alignment = WD_TABLE_ALIGNMENT.LEFT
    t.autofit = False
    borders(t)
    cell_margins(t)
    fixed_layout(t, widths_cm)
    for ri, row in enumerate(rows):
        r = t.add_row()
        trPr = r._tr.get_or_add_trPr()
        cs = OxmlElement("w:cantSplit")
        trPr.append(cs)
        if header and ri == 0:
            th = OxmlElement("w:tblHeader")
            trPr.append(th)
        for ci, val in enumerate(row):
            c = r.cells[ci]
            c.width = Cm(widths_cm[ci])
            if header and ri == 0:
                shade(c, "1B2A41")
                set_text(c, val, bold=True, color=WHITE)
            else:
                if zebra and ri % 2 == 0:
                    shade(c, "F4F7FA")
                set_text(c, val, bold=(ci == 0 and header and len(widths_cm) > 1))
    for row in t.rows:
        for ci, c in enumerate(row.cells):
            c.width = Cm(widths_cm[ci])
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return t


def para(text, size=10.5, bold=False, color=BLACK, after=6, before=0, italic=False):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.space_before = Pt(before)
    r = p.add_run(text)
    r.font.name = FONT
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.color.rgb = color
    r.font.italic = italic
    return p


def bullets(items, style="List Bullet"):
    for it in items:
        doc.add_paragraph(it, style=style)


def numbered(items):
    """Explicit numbering - Word's list style continues across sections otherwise."""
    for i, it in enumerate(items, 1):
        pr = doc.add_paragraph()
        pf = pr.paragraph_format
        pf.left_indent = Cm(1.27)
        pf.first_line_indent = Cm(-1.27)
        pf.space_after = Pt(3)
        pf.line_spacing = 1.10
        r = pr.add_run("%d.	%s" % (i, it))
        r.font.name = FONT
        r.font.size = Pt(10.5)
        r.font.color.rgb = BLACK


def rule(color="0E6E7A", size=12):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(8)
    pPr = p._p.get_or_add_pPr()
    pbdr = OxmlElement("w:pBdr")
    bot = OxmlElement("w:bottom")
    bot.set(qn("w:val"), "single")
    bot.set(qn("w:sz"), str(size))
    bot.set(qn("w:space"), "1")
    bot.set(qn("w:color"), color)
    pbdr.append(bot)
    pPr.append(pbdr)


def h1(text):
    doc.add_paragraph(text, style="Heading 1")


def h2(text):
    doc.add_paragraph(text, style="Heading 2")


# ================= TITLE BLOCK =================
para("PROJECT PROPOSAL", size=9, bold=True, color=TEAL, after=2)
p = doc.add_paragraph()
p.paragraph_format.space_after = Pt(4)
r = p.add_run("Cyber Social Engineering & Fraud Detection Simulation and Assessment System")
r.font.name = FONT
r.font.size = Pt(20)
r.font.bold = True
r.font.color.rgb = NAVY
para(
    "A controlled training platform that lets users practise identifying fraudulent communication "
    "across WhatsApp, Instagram, SMS and Email - and measures how well they decide.",
    size=10.5, color=GREY, after=10,
)
rule()

make_table([
    ["Prepared for", "Client - Cyber Awareness Training Programme"],
    ["Prepared by", "Development Team"],
    ["Document", "Project Proposal - Version 1.0"],
    ["Date", "01 September 2026"],
    ["Delivery duration", "3 weeks (21 days) - 02 September 2026 to 22 September 2026"],
    ["Deployment", "Local system - React, Node.js, Express, MongoDB (localhost)"],
], [4.4, 12.6], header=False, zebra=False)

# ================= 1 =================
h1("1.  Project Overview")
para("Fraudulent and genuine messages arrive through the same apps people use every day. Attackers rely on "
     "urgency, authority, fear, greed and emotional pressure to make a person act before thinking. "
     "Classroom lectures explain this risk, but they do not let a person practise the decision.")
para("This project delivers a browser-based training and assessment platform. The user is placed inside "
     "realistic simulated mobile screens - WhatsApp, Instagram, SMS and Email - and shown a mixture of "
     "genuine and fraudulent communication. For each one, the user decides whether it is safe or fraudulent, "
     "chooses what action to take, and states the reason. The system scores the decision, explains the "
     "warning signs, and builds a complete awareness profile for the user.")
para("The platform is a safe, controlled simulation. It sends no real messages, connects to no external "
     "service, and never asks for or stores any real password, OTP, bank or payment detail.",
     italic=True, color=GREY)

# ================= 2 =================
h1("2.  Objectives")
bullets([
    "Train users to recognise social engineering and fraud attempts across four communication channels.",
    "Measure real decision-making behaviour, not only theoretical knowledge.",
    "Include genuine messages so that users cannot score well by treating everything as fraud.",
    "Give immediate, plain-language feedback explaining why an answer was right or wrong.",
    "Identify each user's emotional weak points through EVI (Emotional Vulnerability Index) profiling.",
    "Give the administrator clear statistics on user performance and organisational weak areas.",
])

# ================= 3 =================
h1("3.  Scope of Work")
make_table([
    ["Module", "What will be delivered"],
    ["User Registration and Login", "User enters name and phone / service number. Details stored in MongoDB. Secure session with logout."],
    ["Briefing Screen", "Explains that this is a controlled training simulation, the rules, and the number of scenarios."],
    ["Dashboard", "Four channel tiles - WhatsApp, Instagram, SMS, Email - each showing Not Started / In Progress / Completed and progress out of 10."],
    ["Assessment Module", "10 scenarios in each of the four channels, 40 scenarios in total. Each scenario shows a realistic mobile screen and asks the user to decide."],
    ["Scoring Engine", "All scoring performed on the server. Deterministic and explainable. The correct answer is never sent to the browser."],
    ["Timing Capture", "Records how long the user takes to open, react to and decide on each scenario."],
    ["Result and Feedback", "Overall score, performance band, channel-wise score, EVI profile and a plain-language feedback paragraph."],
    ["Assessment History", "Every attempt is saved and can be compared against previous attempts."],
    ["Admin Statistics Panel", "Statistics dashboard for the administrator - users, scores, channel performance, EVI trends, most-failed scenarios and CSV export."],
], [4.4, 12.6])

# ================= 4 =================
h1("4.  User Journey")
numbered([
    "User opens the application and enters name and phone / service number.",
    "Details are validated and stored in MongoDB (localhost).",
    "A short briefing screen explains the rules of the simulation.",
    "The dashboard shows the four channels. The user selects any channel.",
    "The server selects 10 scenarios for that channel - a balanced mix of fraudulent and genuine.",
    "For each scenario the user views the simulated mobile screen, decides safe or fraudulent, chooses an action and selects the reason.",
    "The server evaluates the answer, records the timing, awards the score and returns the feedback.",
    "After 10 scenarios the channel is marked Completed and the user returns to the dashboard.",
    "The process repeats until all four channels are complete.",
    "The final result screen shows the overall score, band, channel-wise scores, EVI profile and feedback.",
    "The result is saved to history and the user logs out. The next user starts with a clean session.",
])

# ================= 5 =================
h1("5.  Assessment Screen Design")
para("Every assessment screen is built from three clear sections.")
make_table([
    ["Section", "Purpose", "Contents"],
    ["1. Heading Bar", "Orientation and progress",
     "Channel name, scenario number (for example, Scenario 4 of 10), progress bar, elapsed time and a permanent TRAINING SIMULATION marker."],
    ["2. Mobile Simulation Screen", "The realistic experience",
     "A mobile phone frame showing the WhatsApp, Instagram, SMS or Email screen - sender, profile picture, messages, timestamps, links and attachments. Rendered entirely from the database."],
    ["3. Scoring and Feedback Panel", "The decision and the result",
     "Is it safe or fraudulent? What action will you take? What is the reason? Submit. After submitting: the score awarded and a short feedback paragraph explaining the warning signs and the correct action."],
], [3.9, 3.6, 9.5])
para("The simulated screens are visual replicas built for training. They use fictional names, fictional "
     "numbers, fictional organisations and non-working links. They are not connected to WhatsApp, "
     "Instagram or any real messaging or email service.", size=9.5, italic=True, color=GREY)

# ================= 6 =================
h1("6.  Scenario Coverage")
para("Each channel contains 10 scenarios - approximately 7 fraudulent and 3 genuine. Genuine messages are "
     "included deliberately, so that a user who marks everything as fraud does not score well.")
make_table([
    ["Channel", "Fraud themes covered", "Count"],
    ["WhatsApp", "OTP misdirection, family urgency and relative in distress, honey trap, digital arrest, money transfer request, parcel and customs fee, known-contact takeover, plus genuine family and team chats", "10"],
    ["Instagram", "Honey trap and romance approach, cloned friend account, fake support and copyright warning, lottery and giveaway, fake brand collaboration, investment and quick-money offer, plus genuine order and account notices", "10"],
    ["SMS", "Loan approval and instant loan fraud, lottery and prize win, KYC and account freeze, e-challan and utility bill, parcel delivery, job offer, plus genuine bank and appointment alerts", "10"],
    ["Email", "Credential and password expiry lure, fake invoice and payment change, lottery and prize claim, loan and finance offer, job and recruitment fraud, attachment lure, plus genuine newsletters, receipts and meeting invites", "10"],
    ["Total", "Loan, Lottery, Honey trap, Family urgency, Money fraud, OTP, Job offer, Parcel, KYC, Digital arrest, Fake support, Investment - plus genuine messages", "40"],
], [2.6, 12.2, 2.2])

# ================= 7 =================
h1("7.  Scoring Model")
para("Scoring is calculated on the server, is fully deterministic and can be explained line by line.")
make_table([
    ["Component", "Marks", "How it is awarded"],
    ["Judgement", "0 to 3", "Correct classification of the message as genuine, fraudulent or needing verification."],
    ["Action", "-5 to +5", "Safest action +5, safe but incomplete +3, neutral +1, over-cautious 0, risky -3, critical failure -5 (sharing an OTP, entering credentials or making a payment)."],
    ["Reason", "0 to 2", "Correctly identifying the warning signs present in the message."],
    ["Per scenario", "-5 to +10", "Maximum 10 marks per scenario."],
    ["Per channel", "0 to 100", "Total of the 10 scenarios in that channel."],
    ["Overall score", "0 to 100", "Average of the four channel scores."],
], [3.3, 2.6, 11.1])
para("Performance bands:   85-100 Strong   |   70-84 Developing   |   50-69 Needs Reinforcement   |   Below 50 Immediate Coaching",
     size=10, bold=True, color=NAVY, before=2)
para("Response timing is recorded for every scenario and reported in the result, but it does not add or "
     "remove marks - reading speed is never penalised.", size=9.5, italic=True, color=GREY)

# ================= 8 =================
h1("8.  EVI Profiling (Emotional Vulnerability Index)")
para("Every scenario is tagged with the emotional trigger the fraudster is using. The system compares the "
     "user's performance against each trigger and produces a vulnerability profile, showing which emotional "
     "pressure the user is most likely to fall for.")
make_table([
    ["Emotional trigger", "Typical scenario"],
    ["Authority / Fear", "Digital arrest, police or government notice, account suspension"],
    ["Urgency", "OTP request, KYC freeze, e-challan, password expiry"],
    ["Greed / Reward", "Lottery win, prize claim, instant loan approval, investment offer"],
    ["Empathy / Trust", "Family urgency, relative in distress, colleague request"],
    ["Curiosity", "Parcel delivery, unknown attachment, unexpected invoice"],
    ["Romance / Attraction", "Honey trap, fake profile approach, romance grooming"],
    ["Routine / Convenience", "Fake support message, routine-looking request, false notification"],
], [4.8, 12.2])
para("The EVI profile is a training indicator showing which type of manipulation the user should be most "
     "careful about. It is not a psychological or medical assessment.", size=9.5, italic=True, color=GREY)

# ================= 9 =================
h1("9.  Result and Feedback")
bullets([
    "Overall score out of 100 and the performance band.",
    "Channel-wise scores for WhatsApp, Instagram, SMS and Email.",
    "EVI profile showing the user's strongest and weakest emotional triggers.",
    "Number of correct detections, missed frauds and genuine messages wrongly marked as fraud.",
    "Critical failures - where an OTP, credential or payment was given inside the simulation.",
    "Average decision time and count of impulsive decisions.",
    "A simple feedback paragraph in plain language summarising the result and what to improve.",
    "Comparison against the user's previous attempt, where one exists.",
])

# ================= 10 =================
h1("10.  Admin Statistics Panel")
para("The administrator panel is a statistics and reporting dashboard. Scenario content is loaded into the "
     "database through a controlled import rather than edited from the panel.")
bullets([
    "Total users, total assessments, completed assessments and average score.",
    "Score distribution and performance band distribution.",
    "Channel-wise average performance - WhatsApp, Instagram, SMS and Email.",
    "EVI trigger distribution across all users, showing the weakest emotional area overall.",
    "Fraud-type performance - which fraud themes are most successful against users.",
    "Most-failed scenarios and most commonly missed warning signs.",
    "Average decision time and impulsive-decision rate.",
    "Recent assessment list with drill-down into an individual user's result.",
    "Export of results to CSV.",
])

# ================= 11 =================
h1("11.  Technology")
make_table([
    ["Layer", "Technology", "Runs on"],
    ["Frontend", "React", "localhost:3000"],
    ["Backend", "Node.js with Express (REST API)", "localhost:5000"],
    ["Database", "MongoDB with Mongoose", "localhost:27017"],
    ["Architecture", "Single local full-stack application. All scenario content is stored in the database - no scenario is hard-coded in the interface.", "Local system only"],
], [3.3, 10.2, 3.5])
para("The application runs entirely on a local machine. No cloud service, no internet connection and no "
     "external messaging or email service is used at any point.", size=9.5, italic=True, color=GREY)

# ================= 12 =================
h1("12.  Three-Week Implementation Plan")
make_table([
    ["Week", "Days", "Focus", "Main tasks", "Outcome"],
    ["Week 1", "Day 1-7", "Foundation and engine",
     "Project setup and security baseline; MongoDB models and indexes; user and admin login with sessions; scenario schema finalised from client content; scenario selection engine; answer submission with timing capture; scoring engine",
     "One complete scenario working end to end - login, dashboard, scenario, score and feedback"],
    ["Week 2", "Day 8-14", "Simulations and results",
     "Mobile phone frame component; WhatsApp simulator; SMS simulator; Email simulator; Instagram simulator; timing capture on screen; channel completion flow; result screen; EVI profiling; assessment history and comparison",
     "Full user journey working - all four channels, 40 scenarios, result with EVI profile and history"],
    ["Week 3", "Day 15-21", "Admin, content and delivery",
     "Admin statistics APIs; admin dashboard with charts and tables; drill-down and CSV export; loading of all 40 client scenarios with feedback text; functional and scoring testing; security and compatibility testing; UI polish; documentation and demonstration",
     "Complete, tested, documented and demo-ready application"],
], [1.9, 2.0, 3.1, 6.7, 3.3])

h2("Day-wise breakdown")
make_table([
    ["Day", "Task"],
    ["1", "Project setup, folder structure, React and Express configuration, security baseline"],
    ["2", "MongoDB connection, all database models, indexes and seed scripts"],
    ["3", "User login, admin login, session handling and briefing screen"],
    ["4", "Final scenario schema based on client content; scenario import utility"],
    ["5", "Assessment start and resume; scenario selection engine with balanced fraudulent and genuine mix"],
    ["6", "Scenario delivery API and answer submission API with timing capture"],
    ["7", "Scoring engine; first complete scenario working end to end"],
    ["8", "Mobile phone frame component and WhatsApp simulation screen"],
    ["9", "SMS simulation screen and user action timing capture"],
    ["10", "Email simulation screen with sender and link inspection"],
    ["11", "Instagram simulation screen - profile, feed and direct messages"],
    ["12", "Channel completion flow and full four-channel navigation"],
    ["13", "Result screen, feedback paragraph and EVI profiling"],
    ["14", "Assessment history, previous-attempt comparison and buffer"],
    ["15", "Admin statistics APIs and data aggregation"],
    ["16", "Admin statistics dashboard with charts and tables"],
    ["17", "Individual result drill-down and CSV export"],
    ["18", "Loading of all 40 client scenarios with feedback text and tagging"],
    ["19", "Functional testing and scoring verification across all 40 scenarios"],
    ["20", "Security testing, browser compatibility and accessibility checks"],
    ["21", "Final UI polish, documentation, setup guide and demonstration"],
], [1.6, 15.4])

# ================= 13 =================
h1("13.  Deliverables")
bullets([
    "Complete working application - React frontend, Express backend and MongoDB database.",
    "Full source code with folder structure and configuration files.",
    "Database schema and scenario import scripts.",
    "40 scenarios loaded across the four channels.",
    "Admin statistics panel.",
    "Setup and installation guide, API documentation and administrator guide.",
    "Test report and final quality checklist.",
    "Project plan document and demonstration.",
])

# ================= 14 =================
h1("14.  Inputs Required from the Client")
make_table([
    ["Input", "Required by", "Why it is needed"],
    ["Sample scenario content - 5 to 10 scenarios covering all four channels", "Day 3", "The database schema is finalised on the basis of the actual scenario content."],
    ["Complete scenario pack - 40 scenarios (10 per channel), with the correct answer and warning signs for each", "Day 12", "Required for the content loading and testing stage in Week 3."],
    ["Confirmation of the login fields - name and phone number, or name and service number", "Day 2", "Determines the user registration form and its validation."],
], [7.0, 2.6, 7.4])
para("If the scenario content is delayed, sample scenarios will be prepared internally in the agreed fraud "
     "categories and replaced with the client content as soon as it is received.",
     size=9.5, italic=True, color=GREY)

# ================= 15 =================
h1("15.  Assumptions and Points for Confirmation")
numbered([
    "The assessment consists of 40 scenarios in total - 10 in each of the four channels.",
    "Each channel contains approximately 7 fraudulent and 3 genuine scenarios.",
    "Scenario content is supplied by the client, and the database schema is finalised on the basis of that content.",
    "The admin panel is for statistics and reporting only; scenario content is loaded through a controlled import.",
    "The application runs on a local system only - no cloud, no internet and no real message delivery.",
    "All scenarios, senders, numbers, organisations and links used are entirely fictional.",
    "Feedback can be shown immediately after each scenario or held back until the end; this will be confirmed before the result screen is developed.",
    "The interface language is English.",
])

rule(color="C9D2DC", size=6)
para("This proposal covers the complete scope, design and three-week delivery plan for the Cyber Social "
     "Engineering and Fraud Detection Simulation and Assessment System. On approval, development will begin "
     "as per the day-wise plan set out in Section 12.", size=10, color=GREY)

out = r"D:\Social Engineering Fraud Training PDS\Project_Proposal.docx"
doc.save(out)
print("saved:", out)
