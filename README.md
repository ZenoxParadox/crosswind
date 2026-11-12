# Political Profile: proof of concept

A static website (plain HTML, CSS and JavaScript, no build step) where people answer ten questions and see a profile on five separate scales instead of one left-right line:

1. Economics (left / right)
2. Social values (progressive / conservative)
3. Authority vs. liberty (freedom first / order first)
4. Nationalism (cooperation first / country first)
5. Political violence (sometimes justified / never justified)

Every question has concrete examples and three invented archetype voices (for, in the middle, against). A separate glossary page explains the terms in plain language.

Nothing is stored or sent anywhere. All scoring runs in the browser. There are no cookies, no external fonts, no CDN and no analytics. (If you add analytics later, check the GDPR rules first: political opinions count as sensitive personal data.)

## Files

```
index.html          the quiz page
glossary.html       plain-language definitions
css/style.css       styling (light and dark mode)
js/questions.js     all content: axes, questions, examples, voices
js/scoring.js       scoring logic, no DOM code
js/app.js           the quiz screens
```

## Try it locally

Open `index.html` in a browser, or run a small server:

```
python3 -m http.server 8000
```

then go to <http://localhost:8000>.

## Put it on GitHub Pages

1. Create a new repository on GitHub. On GitHub Free, Pages needs a public repository.
2. Put these files in the root of the repository:

   ```
   git init -b main
   git add .
   git commit -m "Political profile proof of concept"
   git remote add origin git@github.com:USERNAME/REPO.git
   git push -u origin main
   ```

3. In the repository go to **Settings > Pages**, under "Build and deployment" choose **Deploy from a branch**, pick branch `main` and folder `/ (root)`, and save.
4. After a minute or so the site is at `https://USERNAME.github.io/REPO/`.

All links are relative, so it works under the `/REPO/` sub-path.

## How scoring works

Each answer (1 to 5) becomes a number from 0 to 100 on its axis. Each question says which end an "agree" answer moves you toward (`agreeToward` in `js/questions.js`); where "agree" points to the 0 end, the answer is flipped first. "It depends" counts as 3 (the middle) and is flagged on the results page. The axis score is the average of its questions, rounded. The results page shows the full calculation.

If the economics axis is left and either social values or nationalism points to what is usually seen as the right (or the reverse), the results page adds a "Not on one line" note.

## Test the effect of the voices

Open the page with `?voices=after` (for example `index.html?voices=after`) and the three voices appear only after someone has answered. Comparing results with and without that parameter shows whether reading the voices first nudges answers.

## Known limits

- Nationalism and political violence have only one question each. The scores for those are rough. Aim for at least three questions per axis next.
- The wording of the questions, voices and glossary has not been reviewed by people from different political backgrounds. That review is the most important next step.
- English only. All text is in `js/questions.js` and the two HTML files, so a Dutch version means translating those.
- The order of the three voices is fixed (for, middle, against). Randomising it would remove any order effect.
- No results labels (such as "left-nationalist") yet. Labels can feel like verdicts, so they are left out for now.
- Tested by running the scoring in Node and clicking through the quiz in a simulated browser (jsdom). Not yet tried in real browsers or on GitHub Pages itself.
