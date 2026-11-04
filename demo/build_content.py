"""Generates block-markup page content into content/ for the demo school site."""
import pathlib
out = pathlib.Path(__file__).parent / "content"; out.mkdir(exist_ok=True)

def grp(cls, inner, align="full"):
    return f'<!-- wp:group {{"align":"{align}","className":"{cls}","layout":{{"type":"constrained"}}}} -->\n<div class="wp-block-group alignfull {cls}">{inner}</div>\n<!-- /wp:group -->\n'
def h(level, text, extra=""):
    return f'<!-- wp:heading {{"level":{level}}} --><h{level} class="wp-block-heading">{text}</h{level}><!-- /wp:heading -->'
def p(text, cls=""):
    c = f' class="{cls}"' if cls else ""
    a = f' {{"className":"{cls}"}}' if cls else ""
    return f'<!-- wp:paragraph{a} --><p{c}>{text}</p><!-- /wp:paragraph -->'
def html(s): return f'<!-- wp:html -->{s}<!-- /wp:html -->'
def card(icon, title, text, tag=""):
    t = f'<span class="hb-date">{tag}</span>' if tag else f'<div class="hb-ico">{icon}</div>'
    return f'<div class="hb-card">{t}<h3>{title}</h3><p>{text}</p></div>'
def grid(*cards): return html('<div class="hb-grid">' + "".join(cards) + '</div>')
def btns(a, b):
    return ('<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} --><div class="wp-block-buttons">'
      f'<!-- wp:button --><div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="/admissions/">{a}</a></div><!-- /wp:button -->'
      f'<!-- wp:button {{"className":"is-style-outline"}} --><div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button" href="/contact/">{b}</a></div><!-- /wp:button --></div><!-- /wp:buttons -->')
def section(eyebrow, title, lead, body):
    return grp("hb-section", p(eyebrow, "hb-eyebrow has-text-align-center") + h(2, title) + p(lead, "hb-lead") + body)
def stats(*items):
    cells = "".join(f'<div><p class="num">{n}</p><p class="lbl">{l}</p></div>' for n, l in items)
    return grp("hb-stats", html(f'<div class="hb-grid">{cells}</div>'))

home = (
  grp("hb-hero", p("Admissions open for 2027", "hb-eyebrow") + h(1, "Where curious minds grow into confident leaders") +
      p("Harapan Bangsa School nurtures learners from Kindergarten to Grade 12 in a caring, future-ready community.") +
      btns("Apply for 2027", "Book a campus visit") +
      html('<div class="hb-pills wp-block-group" style="display:flex;flex-wrap:wrap;justify-content:center"><p>Founded 2005</p><p>98% university placement</p><p>1:22 teacher ratio</p></div>'))
  + section("Why Harapan Bangsa", "A school that knows every child", "Small classes, modern facilities and a community built on care.",
      grid(card("S","Small classes","An average of 22 students per class, so every child is known by name."),
           card("F","Future-ready learning","Coding, robotics and languages from Grade 1, taught by certified teachers."),
           card("C","Caring community","Counselling, mentoring and a safe campus with 24-hour security.")))
  + stats(("1,200","Students"),("85","Teachers"),("20+","Clubs & teams"),("98%","University placement"))
  + section("Programmes", "A path for every stage", "From first steps to final exams.",
      grid(card("K","Kindergarten","Ages 4-6. Play-based learning that builds language, numeracy and social skills."),
           card("P","Primary","Grades 1-6. Strong foundations in literacy, maths, science, languages and the arts."),
           card("S","Secondary","Grades 7-12. National curriculum with electives in computing, business and design.")))
  + section("What's happening", "News & events", "Join us on campus or catch up on school life.",
      grid(card("","Open Day","Meet teachers, tour classrooms and watch student showcases.","16 Jan 2027"),
           card("","Robotics team wins regionals","Our Grade 9 team took first place with an autonomous sorting robot.","Latest news"),
           card("","New library wing opens","5,000 new books and quiet study pods for secondary students.","Campus")))
  + grp("hb-cta", h(2, "Ready to see it for yourself?") + p("Book a campus tour and meet the team. Applications for the 2027 school year are open.") + btns("Start your application", "Contact admissions"))
)
about = (section("Our story", "Founded on one idea", "Every child learns best when they feel known, challenged and supported. Harapan Bangsa School opened in 2005 with 80 students and has grown into a community of 1,200.", "")
  + section("What we believe", "Our values", "Three principles shape everything we do.",
      grid(card("I","Integrity","We do the right thing, especially when nobody is watching."),
           card("C","Curiosity","We ask questions and enjoy finding the answers."),
           card("R","Respect","We listen, include and look after one another.")))
  + stats(("2005","Founded"),("1,200","Students"),("85","Teachers"),("40+","Nationalities")))
academics = (section("Academics", "Programmes", "National curriculum, enriched.",
      grid(card("K","Kindergarten (4-6)","Play-based learning that builds language, numeracy and social skills."),
           card("P","Primary (Grades 1-6)","Literacy, maths, science, languages and the arts."),
           card("S","Secondary (Grades 7-12)","Core subjects plus electives in computing, business and design.")))
  + section("Beyond the classroom", "Clubs & activities", "Learning does not stop at the bell.",
      grid(card("R","Robotics","Build and compete in regional leagues."),
           card("A","Arts & choir","Annual concert and drama production."),
           card("S","Sports","Football, basketball, swimming and athletics."),
           card("C","Community service","Student-led projects across the city."))))
admissions = (section("Admissions", "How to apply", "Four simple steps from enquiry to offer.",
      grid(card("1","Enquire","Submit the online enquiry form."), card("2","Visit","Attend a campus tour."),
           card("3","Assess","Student assessment and family interview."), card("4","Offer","Receive your offer within 7 days.")))
  + section("Key dates", "2027 intake", "Mark your calendar.",
      grid(card("","Applications open","Enrol early to secure a place.","1 Dec 2026"), card("","Open day","Meet teachers and tour the campus.","16 Jan 2027"), card("","Term starts","Welcome day for new families.","11 Jul 2027")))
  + grp("hb-cta", h(2, "Questions about fees or scholarships?") + p("Fee schedules and scholarship details are sent after your campus tour.") + btns("Book a tour", "Contact us")))
contact = (section("Contact", "Visit us", "We would love to meet you.",
      grid(card("A","Address","Jl. Pendidikan No. 10, Jakarta, Indonesia"), card("P","Phone","+62 21 555 0100"),
           card("E","Email","admissions@school.example.com"), card("O","Office hours","Monday to Friday, 07:30 to 16:00"))))
for n, c in dict(home=home, about=about, academics=academics, admissions=admissions, contact=contact).items():
    (out / f"{n}.html").write_text(c, encoding="utf-8")
print("ok")
