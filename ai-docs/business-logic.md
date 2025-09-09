# Business Logic and Product Vision

This document outlines the core business logic, target audience, and the problem this project aims to solve.

## 1. Overview

The **Customer Sentiment Checker** is a planned software solution designed to automate the analysis of customer feedback. By leveraging the power of Large Language Models (LLMs), the project aims to provide businesses with deep, actionable insights into customer opinions, sentiments, and concerns.

## 2. The Core Business Problem

In today's market, businesses collect vast amounts of customer feedback from various channels, including:

-   Product reviews
-   Social media comments
-   Customer support tickets
-   Surveys and feedback forms

Manually processing this data is inefficient, expensive, and does not scale. As a result, valuable insights that could drive product improvement, enhance customer satisfaction, and reduce churn are often lost. Businesses need an automated, accurate, and scalable way to understand the voice of their customers.

## 3. Proposed Solution

The project will provide a service that ingests customer feedback in text format and uses LLMs to perform nuanced sentiment analysis. The system will go beyond simple positive/negative/neutral classifications to identify specific topics, emotions, and actionable points within the text.

The core of the solution is the `senana/langchain` module, which is responsible for managing and interacting with LLMs via the Ollama service. This architecture allows for flexibility in choosing the right model for the task and ensures the core AI logic is modular and maintainable.

## 4. Target Audience

This product is intended for two primary user groups:

1.  **Business Users**:
    -   **Product Managers**: To understand user pain points and feature requests.
    -   **Marketing Teams**: To gauge public perception of marketing campaigns and brand image.
    -   **Customer Support Managers**: To identify recurring issues and improve support quality.

2.  **Developers**:
    -   Software engineers who need to integrate sentiment analysis capabilities into their own applications (e.g., a helpdesk platform or a social media monitoring tool) via a REST API.

## 5. Key Features (Planned)

The project is envisioned to have the following key features:

-   **Sentiment Analysis**: Classify text as positive, negative, or neutral.
-   **Aspect-Based Analysis**: Identify specific product features or service aspects mentioned and determine the sentiment associated with each (e.g., "The battery life is poor, but the camera is excellent").
-   **Keyword and Topic Extraction**: Automatically pull out key topics and recurring themes from a large volume of feedback.
-   **API Access**: A REST API (as suggested by the `app/api` directory) for programmatic access to the analysis engine.
-   **Scalability**: The architecture is designed to handle a growing volume of data by leveraging the scalable nature of the Ollama service.
