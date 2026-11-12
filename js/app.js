/* The quiz: intro, ten questions, results. No data leaves the browser. */
(function () {
  "use strict";

  var D = window.PP_DATA;
  var S = window.PP_SCORING;
  var QUESTIONS = D.QUESTIONS;
  var AXES = D.AXES;
  var SCALE = D.SCALE;
  var DEPENDS = S.DEPENDS;

  var app = document.getElementById("app");

  // ?voices=after hides the three voices until the person has answered.
  // Useful for testing whether seeing the voices first nudges answers.
  var VOICES_AFTER = new URLSearchParams(window.location.search).get("voices") === "after";

  var index = 0;
  var answers = new Array(QUESTIONS.length).fill(null); // { value: 1-5 | "depends", reason: "" }

  // Small DOM helper. Text is always inserted as text, never as HTML.
  function h(tag, attrs) {
    var el = document.createElement(tag);
    var a = attrs || {};
    Object.keys(a).forEach(function (k) {
      var v = a[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "class") el.className = v;
      else if (k.indexOf("on") === 0 && typeof v === "function") el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, "");
      else el.setAttribute(k, v);
    });
    Array.prototype.slice.call(arguments, 2).flat(Infinity).forEach(function (kid) {
      if (kid === null || kid === undefined || kid === false) return;
      el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    });
    return el;
  }

  function render(node) {
    app.replaceChildren(node);
    var target = node.querySelector("[data-focus]");
    if (target) target.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function glossaryLink(text) {
    return h("a", { href: "glossary.html", target: "_blank", rel: "noopener" }, text);
  }

  /* ---------- Intro ---------- */

  function showIntro() {
    render(h("section", { class: "card" },
      h("h1", { tabindex: "-1", "data-focus": "" }, "Where do you stand? Not on just one line."),
      h("p", {}, "Most political tests squash everything onto a single left-right line. This one looks at five separate things, so you can be left on one and right on another, and the result can show that."),
      h("p", {}, "Every question comes with concrete examples and three voices: one for the statement, one in the middle and one against. Read them first, then answer. “It depends” is always a valid answer."),
      h("ul", { class: "plain" },
        h("li", {}, "Ten questions, about five minutes."),
        h("li", {}, "Nothing is stored or sent anywhere. Your answers stay in this browser tab."),
        h("li", {}, "Unsure about a word? Open the ", glossaryLink("glossary"), " any time.")
      ),
      h("p", { class: "notice" }, "Early proof of concept. The wording has not yet been reviewed by people from different political backgrounds, so treat the result as a rough sketch."),
      h("button", { class: "btn primary", type: "button", onclick: function () { index = 0; showQuestion(); } }, "Start")
    ));
  }

  /* ---------- Questions ---------- */

  function voiceCard(kind, label, v) {
    return h("figure", { class: "voice voice-" + kind },
      h("figcaption", {}, h("span", { class: "voice-label" }, label), h("span", { class: "who" }, v.who)),
      h("blockquote", {}, "“" + v.text + "”")
    );
  }

  function showQuestion() {
    var q = QUESTIONS[index];
    var axis = AXES.filter(function (a) { return a.id === q.axis; })[0];
    var isLast = index === QUESTIONS.length - 1;

    function answered() { return answers[index] !== null; }

    var voicesSection = h("section", { class: "voices-wrap", "aria-labelledby": "voices-title", hidden: VOICES_AFTER && !answered() },
      h("h2", { id: "voices-title" }, "Three voices"),
      h("div", { class: "voices" },
        voiceCard("for", "For the statement", q.voices.for),
        voiceCard("mid", "In the middle", q.voices.middle),
        voiceCard("against", "Against the statement", q.voices.against)
      ),
      h("p", { class: "fine" }, "Invented archetypes, not real people or parties.")
    );
    var voicesHint = (VOICES_AFTER && !answered())
      ? h("p", { class: "fine" }, "The three voices appear after you answer.")
      : null;

    function choice(value, big, small) {
      var id = "answer-" + value;
      var saved = answers[index];
      var input = h("input", { type: "radio", name: "answer", id: id, checked: !!saved && saved.value === value });
      input.addEventListener("change", function () { onAnswer(value); });
      return h("label", { class: "choice", for: id },
        input,
        h("span", { class: "face" }, h("strong", {}, big), small ? h("small", {}, small) : null)
      );
    }

    var textarea = h("textarea", { id: "reason", rows: "3", maxlength: "500" });
    textarea.value = (answers[index] && answers[index].reason) || "";
    textarea.addEventListener("input", function () {
      if (answers[index]) answers[index].reason = textarea.value;
    });
    var reasonBox = h("div", { class: "reason", hidden: !(answers[index] && answers[index].value === DEPENDS) },
      h("label", { for: "reason" }, "Why does it depend? (optional, stays in this tab)"),
      textarea
    );

    var nextBtn = h("button", {
      class: "btn primary", type: "button", disabled: !answered(),
      onclick: function () {
        if (isLast) showResults();
        else { index += 1; showQuestion(); }
      }
    }, isLast ? "See my profile" : "Next");

    function onAnswer(value) {
      var prev = answers[index];
      answers[index] = { value: value, reason: prev ? prev.reason : "" };
      nextBtn.disabled = false;
      reasonBox.hidden = value !== DEPENDS;
      if (VOICES_AFTER) {
        voicesSection.hidden = false;
        if (voicesHint) voicesHint.remove();
      }
    }

    render(h("div", {},
      h("div", { class: "progress" },
        h("span", {}, "Question " + (index + 1) + " of " + QUESTIONS.length),
        h("progress", { max: String(QUESTIONS.length), value: String(index + 1), "aria-label": "Progress" })
      ),
      h("section", { class: "card" },
        h("p", { class: "tag" }, axis.name),
        h("h1", { tabindex: "-1", "data-focus": "" }, q.title),
        h("p", { class: "statement" }, q.statement),
        h("details", { class: "examples", open: true },
          h("summary", {}, "Concrete examples to think about"),
          h("ul", {}, q.examples.map(function (e) { return h("li", {}, e); })),
          q.note ? h("p", { class: "fine" }, q.note) : null
        )
      ),
      voicesSection,
      voicesHint,
      h("fieldset", { class: "card answer" },
        h("legend", {}, "How much do you agree?"),
        h("div", { class: "scale" }, [1, 2, 3, 4, 5].map(function (n) { return choice(n, String(n), SCALE[n - 1]); })),
        h("div", { class: "scale-depends" }, choice(DEPENDS, "It depends", "")),
        reasonBox
      ),
      h("div", { class: "nav" },
        h("button", {
          class: "btn", type: "button",
          onclick: function () {
            if (index === 0) showIntro();
            else { index -= 1; showQuestion(); }
          }
        }, "Back"),
        nextBtn
      ),
      h("p", { class: "fine" }, "Unsure about a word? ", glossaryLink("Open the glossary"), " (opens in a new tab).")
    ));
  }

  /* ---------- Results ---------- */

  function answerLabel(a) {
    if (a === DEPENDS) return "It depends (counted as 3)";
    return a + " - " + SCALE[a - 1];
  }

  function axisCard(r) {
    var axis = r.axis;
    var marker = h("div", { class: "marker" });
    marker.style.left = r.score + "%";

    var meta = "Based on " + r.n + (r.n === 1 ? " question" : " questions");
    if (r.depends) meta += " · " + r.depends + " answered “it depends”";
    if (r.n === 1) meta += " · only one question, so treat this as rough";

    return h("section", { class: "card axis" },
      h("h3", {}, axis.name),
      h("p", { class: "verdict" }, S.describe(axis, r.score), h("span", { class: "score" }, " (" + r.score + "/100)")),
      h("div", {
        class: "bar", role: "img",
        "aria-label": axis.name + ": " + r.score + " out of 100, where 0 is " + axis.poleA.name + " and 100 is " + axis.poleB.name
      },
        h("div", { class: "track" }, marker),
        h("div", { class: "poles" },
          h("span", {}, h("strong", {}, axis.poleA.name), h("small", {}, axis.poleA.hint)),
          h("span", {}, h("strong", {}, axis.poleB.name), h("small", {}, axis.poleB.hint))
        )
      ),
      h("p", { class: "fine" }, axis.blurb),
      h("p", { class: "fine" }, meta)
    );
  }

  function calcTable(r) {
    var axis = r.axis;
    return h("div", { class: "table-wrap" },
      h("h4", {}, axis.name + " (0 = " + axis.poleA.name + ", 100 = " + axis.poleB.name + ")"),
      h("table", {},
        h("thead", {}, h("tr", {},
          h("th", {}, "Question"), h("th", {}, "Your answer"), h("th", {}, "“Agree” moves toward"), h("th", {}, "Points (0-100)")
        )),
        h("tbody", {}, r.rows.map(function (row) {
          var pole = row.question.agreeToward === "A" ? axis.poleA : axis.poleB;
          return h("tr", {},
            h("td", {}, "Q" + row.number + " " + row.question.title),
            h("td", {}, answerLabel(row.answer)),
            h("td", {}, pole.name),
            h("td", {}, String(row.contribution))
          );
        }))
      ),
      h("p", { class: "fine" }, "Axis score = average of the points above" + (r.n > 1 ? " (" + r.n + " questions)." : " (one question)."))
    );
  }

  function copyText(text, button) {
    function done() {
      var old = button.textContent;
      button.textContent = "Copied";
      setTimeout(function () { button.textContent = old; }, 1500);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { window.prompt("Copy your result:", text); });
    } else {
      window.prompt("Copy your result:", text);
    }
  }

  function showResults() {
    var values = answers.map(function (a) { return a.value; });
    var results = S.scoreAxes(AXES, QUESTIONS, values);
    var scores = {};
    results.forEach(function (r) { scores[r.axis.id] = r.score; });
    var notes = S.crossPressure(scores);
    var dependsTotal = values.filter(function (v) { return v === DEPENDS; }).length;

    var reasons = [];
    answers.forEach(function (a, i) {
      if (a.reason && a.reason.trim()) reasons.push({ i: i, text: a.reason.trim() });
    });

    var copyBtn = h("button", { class: "btn", type: "button" }, "Copy my result as text");
    copyBtn.addEventListener("click", function () { copyText(S.summaryText(results), copyBtn); });

    render(h("div", {},
      h("section", { class: "card" },
        h("h1", { tabindex: "-1", "data-focus": "" }, "Your profile"),
        h("p", {}, "Five separate scales, not one line. The marker shows where your answers land between the two ends. Near the middle means mixed or undecided."),
        h("p", { class: "fine" }, "This is a rough sketch from ten statements, not a verdict. Nationalism and political violence are each measured with only one question.")
      ),
      results.map(axisCard),
      notes.length ? h("section", { class: "card cross" },
        h("h2", {}, "Not on one line"),
        notes.map(function (n) { return h("p", {}, n); })
      ) : null,
      dependsTotal >= 5 ? h("section", { class: "card" },
        h("p", {}, "You answered “it depends” on " + dependsTotal + " of " + QUESTIONS.length + " questions. The numbers are less reliable for you, and your own notes may say more than the scores.")
      ) : null,
      reasons.length ? h("section", { class: "card" },
        h("h2", {}, "Your “it depends” notes"),
        h("ul", {}, reasons.map(function (r) {
          return h("li", {}, h("strong", {}, "Q" + (r.i + 1) + " " + QUESTIONS[r.i].title + ": "), r.text);
        }))
      ) : null,
      h("details", { class: "card" },
        h("summary", {}, "How this was calculated"),
        h("p", {}, "Each answer from 1 to 5 becomes a number from 0 to 100 on its scale. Where “agree” points toward the 0 end, the answer is flipped first. “It depends” counts as 3, the middle, and is flagged. The axis score is the average, rounded."),
        results.map(calcTable)
      ),
      h("div", { class: "nav results-nav" },
        copyBtn,
        h("button", { class: "btn", type: "button", onclick: function () { index = 0; showQuestion(); } }, "Change my answers"),
        h("button", {
          class: "btn", type: "button",
          onclick: function () { answers.fill(null); index = 0; showIntro(); }
        }, "Start over")
      ),
      h("p", { class: "fine" }, glossaryLink("Open the glossary"), " for plain-language definitions (opens in a new tab).")
    ));
  }

  showIntro();
}());
