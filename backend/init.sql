
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  nickname VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  summary VARCHAR(500),
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  read_time VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, article_id)
);

DROP INDEX IF EXISTS idx_articles_category;
CREATE INDEX idx_articles_category ON articles(category);
DROP INDEX IF EXISTS idx_bookmarks_user;
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);

INSERT INTO articles (title, summary, content, category, read_time)
SELECT '大语言模型(LLM)入门', '什么是大语言模型，它为什么能理解和生成人类语言。', '大语言模型是一类通过海量文本训练出来的神经网络，核心任务是预测下一个词元。\n\n当模型规模足够大时，它会涌现出翻译、问答、写代码等能力，而这些能力并没有被单独编程进去。\n\n理解"预测下一个词元"这个本质，是理解 LLM 一切行为的起点。', '大模型基础', '5 分钟'
WHERE NOT EXISTS (SELECT 1 FROM articles WHERE title = '大语言模型(LLM)入门');
INSERT INTO articles (title, summary, content, category, read_time)
SELECT 'Transformer 架构详解', '支撑现代大模型的核心架构是怎么工作的。', 'Transformer 于 2017 年提出，用自注意力机制替代了传统的循环结构，实现了完全并行化训练。\n\n自注意力让模型在处理每个词时，都能直接看到句子中的其他词，并学到它们之间的依赖关系。\n\n多头注意力、位置编码、前馈网络三大组件组合起来，构成了 Transformer 块的主体。', '架构原理', '8 分钟'
WHERE NOT EXISTS (SELECT 1 FROM articles WHERE title = 'Transformer 架构详解');
INSERT INTO articles (title, summary, content, category, read_time)
SELECT '提示工程实用技巧', '写好提示词的几个关键原则。', '提示工程是与大模型高效协作的核心技能。清晰的指令、充足的上下文、明确的输出格式，是三个最基本的要素。\n\n把复杂任务拆成步骤，让模型先思考再回答，往往能显著提升准确率。\n\n给出输入输出示例（少样本提示）是提升稳定性的最有效手段之一。', '提示工程', '6 分钟'
WHERE NOT EXISTS (SELECT 1 FROM articles WHERE title = '提示工程实用技巧');
INSERT INTO articles (title, summary, content, category, read_time)
SELECT 'AI 安全与对齐问题', '如何让模型的行为符合人类意图。', '对齐问题是 AI 安全的核心：如何确保越来越强的模型始终按照人类的意图行事。\n\n常见的风险包括幻觉输出、有害内容生成和被提示词注入攻击。\n\n目前主流的缓解手段有 RLHF 人类反馈强化学习、内容过滤和输出审查。', 'AI 安全', '7 分钟'
WHERE NOT EXISTS (SELECT 1 FROM articles WHERE title = 'AI 安全与对齐问题');
INSERT INTO articles (title, summary, content, category, read_time)
SELECT 'RAG 检索增强生成', '让模型基于你的私有数据回答问题。', 'RAG 的思路是先把文档切成片段并存入向量数据库，用户提问时检索相关片段，再连同问题一起交给模型。\n\n这样可以显著减少幻觉，且知识更新无需重新训练模型。\n\n片段切分策略和检索质量，直接决定 RAG 系统的最终效果。', '应用实践', '7 分钟'
WHERE NOT EXISTS (SELECT 1 FROM articles WHERE title = 'RAG 检索增强生成');
INSERT INTO articles (title, summary, content, category, read_time)
SELECT '模型微调: LoRA 与全参微调', '让通用模型变成领域专家的两条路。', '全参微调更新模型的全部权重，效果好但显存开销巨大。\n\nLoRA 只训练少量旁路低秩矩阵，冻结原始权重，成本可以低两个数量级。\n\n对于多数垂直场景，LoRA 加高质量数据集是目前性价比最高的方案。', '应用实践', '6 分钟'
WHERE NOT EXISTS (SELECT 1 FROM articles WHERE title = '模型微调: LoRA 与全参微调');
INSERT INTO articles (title, summary, content, category, read_time)
SELECT '多模态模型简介', '同时理解文本、图像和声音的模型。', '多模态模型把不同模态的输入映射到统一的语义空间，从而实现跨模态理解与生成。\n\n典型能力包括看图问答、文档 OCR 理解和图像生成。\n\n多模态正在成为新一代 AI 应用的标配能力。', '大模型基础', '5 分钟'
WHERE NOT EXISTS (SELECT 1 FROM articles WHERE title = '多模态模型简介');
INSERT INTO articles (title, summary, content, category, read_time)
SELECT 'AI Agent 智能体', '让模型自主使用工具完成复杂任务。', 'Agent 的本质是让模型在一个循环中：观察、思考、调用工具、再观察，直到任务完成。\n\n工具调用能力让模型可以搜索网页、执行代码、查询数据库。\n\n设计好工具接口和反馈机制，是构建可靠 Agent 的关键。', '应用实践', '8 分钟'
WHERE NOT EXISTS (SELECT 1 FROM articles WHERE title = 'AI Agent 智能体');
INSERT INTO articles (title, summary, content, category, read_time)
SELECT '开源大模型生态一览', '当前主流的开源模型与它们的特点。', '开源大模型社区发展迅速，Llama、Qwen、DeepSeek、Mistral 等系列是其中的代表。\n\n选择模型时主要看参数规模、上下文长度、许可证和中文能力。\n\n开源模型加上本地部署，是数据敏感场景的首选方案。', '大模型基础', '6 分钟'
WHERE NOT EXISTS (SELECT 1 FROM articles WHERE title = '开源大模型生态一览');
INSERT INTO articles (title, summary, content, category, read_time)
SELECT 'AI 在网络安全中的应用', '攻防两侧的智能化实践。', '在防御侧，AI 可用于日志异常检测、告警降噪和钓鱼邮件识别。\n\n在攻击侧，攻击者也在利用 AI 生成钓鱼文本和变形恶意代码。\n\n理解 AI 的能力边界，是安全从业者的必修课。', 'AI 安全', '7 分钟'
WHERE NOT EXISTS (SELECT 1 FROM articles WHERE title = 'AI 在网络安全中的应用');

CREATE TABLE IF NOT EXISTS topics (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) UNIQUE NOT NULL,
  subtitle VARCHAR(300),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS topic_articles (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
  article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(topic_id, article_id)
);

DROP INDEX IF EXISTS idx_topic_articles_topic;
CREATE INDEX idx_topic_articles_topic ON topic_articles(topic_id);

INSERT INTO topics (title, subtitle)
SELECT '大模型入门专题', '从概念到架构，打好地基'
WHERE NOT EXISTS (SELECT 1 FROM topics WHERE title = '大模型入门专题');

INSERT INTO topics (title, subtitle)
SELECT '提示工程实战专题', '从基本原则到进阶技巧，一站读完'
WHERE NOT EXISTS (SELECT 1 FROM topics WHERE title = '提示工程实战专题');

INSERT INTO topics (title, subtitle)
SELECT 'AI 安全与对齐专题', '攻防、越狱与对齐的必修课'
WHERE NOT EXISTS (SELECT 1 FROM topics WHERE title = 'AI 安全与对齐专题');

INSERT INTO topic_articles (topic_id, article_id)
SELECT t.id, a.id FROM topics t JOIN articles a ON a.category IN ('大模型基础', '架构原理')
WHERE t.title = '大模型入门专题'
  AND NOT EXISTS (SELECT 1 FROM topic_articles ta WHERE ta.topic_id = t.id AND ta.article_id = a.id);

INSERT INTO topic_articles (topic_id, article_id)
SELECT t.id, a.id FROM topics t JOIN articles a ON a.category IN ('提示工程', '应用实践')
WHERE t.title = '提示工程实战专题'
  AND NOT EXISTS (SELECT 1 FROM topic_articles ta WHERE ta.topic_id = t.id AND ta.article_id = a.id);

INSERT INTO topic_articles (topic_id, article_id)
SELECT t.id, a.id FROM topics t JOIN articles a ON a.category = 'AI 安全'
WHERE t.title = 'AI 安全与对齐专题'
  AND NOT EXISTS (SELECT 1 FROM topic_articles ta WHERE ta.topic_id = t.id AND ta.article_id = a.id);

CREATE TABLE IF NOT EXISTS search_logs (
  id SERIAL PRIMARY KEY,
  term VARCHAR(100) UNIQUE NOT NULL,
  hits INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP INDEX IF EXISTS idx_search_logs_hits;
CREATE INDEX idx_search_logs_hits ON search_logs(hits);

INSERT INTO search_logs (term, hits)
SELECT 'Transformer', 26
WHERE NOT EXISTS (SELECT 1 FROM search_logs WHERE term = 'Transformer');

INSERT INTO search_logs (term, hits)
SELECT 'RAG', 22
WHERE NOT EXISTS (SELECT 1 FROM search_logs WHERE term = 'RAG');

INSERT INTO search_logs (term, hits)
SELECT '提示工程', 19
WHERE NOT EXISTS (SELECT 1 FROM search_logs WHERE term = '提示工程');

INSERT INTO search_logs (term, hits)
SELECT 'LoRA', 15
WHERE NOT EXISTS (SELECT 1 FROM search_logs WHERE term = 'LoRA');

INSERT INTO search_logs (term, hits)
SELECT 'AI 安全', 14
WHERE NOT EXISTS (SELECT 1 FROM search_logs WHERE term = 'AI 安全');

INSERT INTO search_logs (term, hits)
SELECT 'Agent', 12
WHERE NOT EXISTS (SELECT 1 FROM search_logs WHERE term = 'Agent');

INSERT INTO search_logs (term, hits)
SELECT '大模型', 10
WHERE NOT EXISTS (SELECT 1 FROM search_logs WHERE term = '大模型');

INSERT INTO search_logs (term, hits)
SELECT '多模态', 8
WHERE NOT EXISTS (SELECT 1 FROM search_logs WHERE term = '多模态');

CREATE TABLE IF NOT EXISTS news (
  id SERIAL PRIMARY KEY,
  title VARCHAR(300) NOT NULL,
  link VARCHAR(500) UNIQUE NOT NULL,
  source VARCHAR(100),
  published_at TIMESTAMP,
  excerpt VARCHAR(500),
  content TEXT,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP INDEX IF EXISTS idx_news_published;
CREATE INDEX idx_news_published ON news(published_at);
