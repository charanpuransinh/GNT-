# .gnt/ SETUP — ONE-TIME STEPS (करने के बाद यह automatic चलता रहेगा)

## Step 1 — यह पूरा `.gnt/` और `.github/` folder अपनी GNT repo के root में डालें
(जैसे पहले AI_TEAM_CHARTER डाला था, वैसे ही)

## Step 2 — Anthropic API key बनाएं (एक बार)
1. https://console.anthropic.com पर जाएं, login करें
2. "API Keys" में जाकर नई key बनाएं
3. उसे copy करें (यह आपके $20 Claude Pro subscription से अलग है — pay-per-use billing यहां अलग से जुड़ती है)

## Step 3 — वह key GitHub repo में secret के रूप में डालें (एक बार)
1. अपनी repo खोलें → Settings → Secrets and variables → Actions
2. "New repository secret" पर क्लिक करें
3. Name: `ANTHROPIC_API_KEY`
4. Value: वह key जो आपने console.anthropic.com से copy की
5. Save करें

## Step 4 — बाकी automatic tools भी एक बार configure करें
- CodeQL: repo Settings → Security → Code security → "Set up CodeQL" (Default चुनें)
- Dependabot: repo Settings → Security → "Enable Dependabot alerts" + "Enable Dependabot security updates"
- CodeRabbit: GitHub Marketplace → CodeRabbit → Configure → अपनी repo select करें

## इसके बाद रोज़मर्रा में आपको क्या करना है?
सिर्फ यह: `.gnt/02_AI_TASKS/00_INBOX/` में एक नई task file डालें (TASK_TEMPLATE.md को copy
करके भरें) और push कर दें। बाकी सब अपने-आप होगा:
- Aider अपने-आप उस task को पढ़कर काम करेगा
- Result अपने-आप उसी file में evidence के तौर पर लिख देगा
- File अपने-आप `50_TEST/` में move हो जाएगी
- CodeQL, Dependabot, CodeRabbit अपने-आप हर push पर चलते रहेंगे

## आपको फिर भी कब manually कुछ करना पड़ेगा?
- नई task file बनाकर INBOX में डालना (यह आप या मैं चैट में मिलकर करेंगे)
- Test results/security findings देखकर आगे कोई architecture decision लेना
- Claude Code से कोई गहरा debugging कराना हो तो
- मुझसे (Claude चैट) किसी task का final review कराना हो तो
