# hun-bot.dev
> **Zero-Cost, AI-Native Tech Blog** powered by **Local LLM Pipeline** 
> 
> Live Site: [https://hun-bot.dev](https://hun-bot.dev)

![Astro](https://img.shields.io/badge/Framework-Astro-orange?style=flat-square)
![Ollama](https://img.shields.io/badge/AI-Ollama-white?style=flat-square)
![Python](https://img.shields.io/badge/Python-3.11-blue?style=flat-square)
![Docker](https://img.shields.io/badge/Infra-Docker-2496ED?style=flat-square)
![Grafana](https://img.shields.io/badge/Ops-Grafana-F46800?style=flat-square)

## Architecture & Workflow
**Hybrid Architecture**: Serverless Frontend (Vercel) + Local AI Backend (Mac M4 Pro).

<img src="public/images/BLOG/blog-arch-v2.png" width="100%" alt="Architecture">

## Key Engineering Highlights

| Component | Tech Stack | Description |
| :--- | :--- | :--- |
| **Orchestrator** | **Python 3.11** | Automated batch translation pipeline using `tqdm` & `psutil`. |
| **Inference** | **Ollama** | **Zero-Cost** local serving (En: `gemma2:9b` / Jp: `qwen2.5:7b`). |
| **Observability** | **Grafana + PG** | Real-time monitoring of **TPS (Tokens/sec)** & **GFLOPS**. |
| **Consistency** | **Regex/YAML** | Strict metadata parsing to prevent structure collapse. |