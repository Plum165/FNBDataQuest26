# 🏦 FNB Credit Risk Analytics Workstation

### DataQuest 2026 — Interpretable Credit Risk Modelling & Decision Support

An interactive credit-risk analytics workstation developed for the **2026 DataQuest project**. The system combines exploratory data analysis, statistical research, interpretable machine learning, logistic regression, credit-scorecard concepts, and business decision support into a unified analytical platform.

The primary objective is not simply to predict credit default, but to **understand why borrowers are considered risky**, identify meaningful patterns in the data, and use those insights to improve an interpretable logistic regression model.

---

# 📌 Project Overview

Credit-risk modelling requires more than achieving a high predictive score. Financial institutions need models that can be:

* Interpreted by analysts
* Explained to decision-makers
* Audited and validated
* Translated into business rules
* Used to support lending decisions

This project therefore follows an **exploration → interpretation → modelling → decision-support** workflow.

The workstation allows an analyst to:

1. Explore borrower characteristics.
2. Investigate relationships between variables.
3. Identify data-quality problems.
4. Research alternative analytical techniques.
5. Discover risk patterns and subgroup behaviour.
6. Engineer meaningful modelling features.
7. Train and evaluate logistic regression.
8. Interpret model coefficients and statistical significance.
9. Translate model outputs into scorecard-style points.
10. Simulate business decisions using different approval thresholds.

---

# 🎯 Project Objectives

The project focuses on four main objectives:

### 1. Exploratory Analysis

Understand the structure and behaviour of the credit-risk dataset through interactive visualisation and statistical analysis.

### 2. Interpretable Modelling

Develop an interpretable logistic regression model for binary default prediction.

### 3. Feature Discovery

Use exploratory techniques to identify relationships, transformations, interactions, and subgroup behaviours that may improve the final model.

### 4. Business Decision Support

Translate predictive model outputs into practical lending decisions and demonstrate the trade-off between approval volume and portfolio risk.

---

# 🧠 Analytical Philosophy

The project deliberately separates **exploration** from **final prediction**.

Alternative analytical techniques can be useful for discovering structure in the data without necessarily becoming the final production model.

The workflow is therefore:

```text
Raw Credit Data
       ↓
Data Quality Assessment
       ↓
Exploratory Data Analysis
       ↓
Statistical / Multivariate Research
       ↓
Risk Pattern Discovery
       ↓
Feature Engineering
       ↓
Logistic Regression
       ↓
Model Evaluation
       ↓
Scorecard Interpretation
       ↓
Business Policy Simulation
```

This allows more complex analytical techniques to contribute to the project while keeping the final predictive model interpretable.

---

# 📊 Dataset

The workstation is designed around borrower-level credit-risk information.

Key variables include:

| Variable                 | Description                                             |
| ------------------------ | ------------------------------------------------------- |
| **FICO Score**           | Numerical representation of borrower creditworthiness   |
| **Debt-to-Income (DTI)** | Proportion of income committed to debt repayments       |
| **Annual Income**        | Borrower's annual income                                |
| **Employment Length**    | Number of years in current employment                   |
| **Defaulted**            | Binary target indicating whether the borrower defaulted |

The target variable is binary:

```text
0 → No Default
1 → Default
```

---

# 🔬 Research Framework

A baseline research framework was created for each analytical technique investigated.

Each research topic follows the same structure:

## A. What is it?

A conceptual explanation of the method and its purpose.

## B. How does it work?

The underlying mechanics, mathematical formulation, equations, and visual interpretation.

## C. Example in Credit Risk

How the technique could be applied to borrower behaviour and default analysis.

## D. Strengths and Weaknesses

Critical evaluation of the method, including interpretability, complexity, assumptions, and limitations.

## E. Comparison to Logistic Regression

Evaluation of how the method differs from the final interpretable modelling approach.

## F. How It Influenced Our Project

Explanation of whether the technique contributed to:

* Feature engineering
* Risk segmentation
* Pattern discovery
* Variable selection
* Interpretation
* Model design
* Business understanding

The final section is particularly important because it demonstrates that the research was integrated into the project rather than simply being theoretical background.

---

# 🔎 Analytical Techniques Investigated

Several methods were considered as part of the exploratory and research process.

### Classification Trees

Used to investigate non-linear relationships and identify potential decision boundaries or subgroups within borrower populations.

### Discriminant Analysis

Investigated as an alternative statistical classification approach and compared against logistic regression in terms of assumptions and interpretability.

### Multiple Correspondence Analysis (MCA)

Considered for exploring relationships between categorical variables and identifying groups of borrowers with similar categorical profiles.

### Correspondence Analysis

Investigated as a method for understanding associations between categorical dimensions.

### Multidimensional Scaling (MDS)

Considered as a dimensionality-reduction and visualisation technique for exploring similarity between observations.

These methods were not necessarily included as final production models. Instead, they were evaluated according to their ability to generate **interpretable insights that could influence the final logistic regression model**.

---

# 📈 Exploratory Data Analysis

The workstation provides interactive exploratory modules for examining the dataset before modelling.

## Univariate Analysis

Individual variables can be inspected to understand:

* Distribution
* Central tendency
* Spread
* Skewness
* Outliers
* Missing values
* Differences between default and non-default populations

For example, FICO distributions can be compared between:

```text
GOOD → Borrowers who did not default
BAD  → Borrowers who defaulted
```

This provides an initial indication of whether a variable contains useful discriminatory information.

---

# 🔗 Bivariate Analysis

Relationships between variables can be investigated using:

* Scatter plots
* Correlation analysis
* Density plots
* Group comparisons
* Interactive visualisations

The purpose is to identify:

* Correlations
* Potential multicollinearity
* Interactions
* Non-linear relationships
* Risk concentrations
* Subgroup behaviour

These insights can then influence feature engineering and model specification.

---

# 🧹 Data Quality

Data quality is treated as an important part of the modelling pipeline.

The workstation investigates:

* Missing values
* Invalid values
* Extreme observations
* Skewed distributions
* Potential anomalies
* Outliers

Preprocessing functionality includes approaches such as:

* Outlier capping
* Winsorisation
* Imputation
* Anomaly handling

The goal is to improve model stability without introducing unnecessary bias into the default-rate calculations.

---

# 📐 Weight of Evidence & Information Value

Credit-risk modelling commonly requires interpretable transformations of predictor variables.

The project therefore investigates **Weight of Evidence (WoE)** and **Information Value (IV)**.

### Weight of Evidence

WoE measures the relative strength of evidence associated with a particular variable bin.

Conceptually:

```text
WoE = ln(% Goods / % Bads)
```

The sign and magnitude provide information about how strongly a particular category or interval is associated with risk.

### Information Value

Information Value measures the overall discriminatory usefulness of a variable across its bins.

Conceptually:

```text
IV = Σ (% Goods - % Bads) × WoE
```

These concepts help assess whether variables contain useful information for credit-risk modelling.

---

# 🤖 Logistic Regression

Logistic regression is the primary predictive modelling technique used in the project.

The model estimates the probability of default:

```text
P(Default = 1 | X)
```

using the logistic function:

```text
p = 1 / (1 + e^(-z))
```

where:

```text
z = β₀ + β₁X₁ + β₂X₂ + ... + βₙXₙ
```

The resulting probability can then be converted into a risk classification or used for ranking borrowers by risk.

---

# 📊 Logistic Regression Interpretation

The model provides several interpretable statistical outputs.

### Coefficients

Each coefficient represents the change in the log-odds of default associated with a one-unit change in the predictor, holding other variables constant.

### Intercept

Represents the baseline log-odds when predictor values are zero.

### Standard Error

Measures uncertainty around the estimated coefficient.

### P-Value

Used to assess whether there is statistical evidence that a predictor contributes to the model.

### Odds Ratio

Calculated as:

```text
Odds Ratio = e^β
```

This provides a more intuitive interpretation of how the odds of default change with a predictor.

---

# 📏 Model Evaluation

The model is evaluated using several complementary metrics.

## ROC-AUC

AUC measures the model's ability to distinguish between defaulting and non-defaulting borrowers across different classification thresholds.

```text
AUC = 0.50 → Random discrimination
AUC = 1.00 → Perfect discrimination
```

An AUC of approximately **0.892** was achieved in the demonstrated modelling configuration.

---

## Gini Coefficient

The Gini coefficient is related directly to AUC:

```text
Gini = 2 × AUC - 1
```

For example:

```text
AUC = 0.892

Gini = 2(0.892) - 1
     = 0.784
     ≈ 78.4%
```

The Gini statistic provides another way of expressing discriminatory power.

---

## Kolmogorov-Smirnov (KS)

The KS statistic measures the maximum separation between the cumulative distributions of goods and bads.

It is particularly useful for understanding how effectively the model separates risky and non-risky populations across score bands.

---

# 🧮 Credit Scorecard

The project extends logistic regression interpretation into a scorecard-style framework.

Instead of presenting only:

```text
Probability of Default = 0.23
```

the model can be translated into a points-based representation.

For example:

```text
Higher Risk
     ↓
Fewer Points
     ↓
Lower Credit Score
```

and:

```text
Lower Risk
     ↓
More Points
     ↓
Higher Credit Score
```

This provides a more intuitive representation for users such as credit analysts and underwriters.

---

# 💼 Business Decision Dashboard

Predictive modelling is connected to business decision-making through an interactive policy simulation.

The dashboard allows analysts to investigate how changing a decision threshold affects:

* Approval volume
* Default rate
* Precision
* Recall
* Portfolio risk
* Potential business trade-offs

This demonstrates an important principle:

> A model does not make the business decision by itself. The decision threshold determines how model predictions are converted into policy.

For example:

```text
Lower Approval Threshold
        ↓
More Applications Approved
        ↓
Higher Potential Volume
        ↓
Potentially Higher Default Exposure
```

Whereas:

```text
Higher Approval Threshold
        ↓
Fewer Applications Approved
        ↓
Lower Expected Risk
        ↓
Potentially Lower Portfolio Volume
```

The dashboard allows this trade-off to be explored interactively.

---

# 🖥️ Interactive Workstation

The final application combines the analytical components into a unified workstation.

Major modules include:

### Research

Provides mathematical and conceptual explanations of the analytical methods used throughout the project.

### Univariate Explorer

Allows individual variables and their relationship with default behaviour to be explored.

### Bivariate Explorer

Investigates relationships between variables and potential interaction patterns.

### Data Quality

Provides a structured overview of missing values, outliers, anomalies, and preprocessing decisions.

### Logistic Regression

Displays model performance and statistical parameters.

### Scorecard

Converts model information into an interpretable points-based representation.

### Business Dashboard

Allows lending-policy scenarios and risk/volume trade-offs to be explored.

### AI Reflection Log

Documents how artificial intelligence was used during the development and reasoning process.

---

# 🤖 AI Usage & Human-AI Collaboration

AI was used as an **analytical and reasoning assistant**, rather than as a replacement for project implementation or decision-making.

AI assistance was primarily used to:

* Interpret the project specification
* Clarify modelling requirements
* Explain statistical concepts
* Compare analytical techniques
* Validate architectural decisions
* Explore possible modelling approaches
* Discuss feature-engineering strategies
* Review conceptual interpretations
* Assist with presentation planning

The final analytical decisions remained subject to human evaluation.

The AI reflection process specifically considered:

```text
AI Suggestion
     ↓
Human Evaluation
     ↓
Accept / Modify / Reject
     ↓
Reason Documented
     ↓
Project Decision
```

This approach ensures that AI-generated suggestions were treated as inputs into the reasoning process rather than automatically accepted as correct.

---

# 🧾 AI Reflection Structure

The project's AI reflection follows several key themes.

## Understanding the Specification

AI was used to break down the DataQuest requirements and clarify the relationship between:

* EDA
* Feature engineering
* Interpretable machine learning
* Logistic regression
* Business decision support

## Validating Project Direction

AI was used to evaluate whether the proposed architecture and analytical workflow aligned with the project requirements.

## Comparative Analysis

Different modelling and exploratory techniques were discussed to understand their advantages, disadvantages, assumptions, and relevance to credit-risk analysis.

## Human Decision-Making

The project distinguishes between:

```text
AI-assisted reasoning
```

and:

```text
Final project decisions
```

The latter were determined through evaluation of the project's requirements, data, analytical objectives, and practical constraints.

---

# 🎤 Demonstration Structure

The application can be demonstrated through the following workflow:

### 1. Load the Data

Demonstrate the data portal and show how a credit-risk dataset is imported.

### 2. Inspect Data Quality

Identify missing values, anomalies, skewness, and outliers.

### 3. Explore the Dataset

Use univariate and bivariate analysis to understand borrower behaviour.

### 4. Research Analytical Methods

Explain why different techniques were considered and how they contributed to the project.

### 5. Build Logistic Regression

Train and evaluate the final interpretable predictive model.

### 6. Interpret the Model

Review:

* Coefficients
* Standard errors
* P-values
* Odds ratios
* AUC
* Gini
* KS

### 7. Generate Scorecard Information

Translate model behaviour into a more intuitive points-based framework.

### 8. Simulate Business Decisions

Change decision thresholds and observe the effect on portfolio volume and risk.

### 9. Review AI Governance

Demonstrate how AI contributed to the development process and how decisions were evaluated.

---

# 🏗️ Project Architecture

At a high level, the system follows:

```text
                  ┌─────────────────────┐
                  │    Credit Dataset   │
                  └──────────┬──────────┘
                             ↓
                  ┌─────────────────────┐
                  │   Data Validation   │
                  │   & Quality Checks  │
                  └──────────┬──────────┘
                             ↓
                  ┌─────────────────────┐
                  │       EDA           │
                  │ Univariate/Bivariate│
                  └──────────┬──────────┘
                             ↓
                  ┌─────────────────────┐
                  │ Analytical Research │
                  │ Trees / MCA / DA /  │
                  │ CA / MDS / WoE / IV │
                  └──────────┬──────────┘
                             ↓
                  ┌─────────────────────┐
                  │ Feature Engineering │
                  └──────────┬──────────┘
                             ↓
                  ┌─────────────────────┐
                  │ Logistic Regression │
                  └──────────┬──────────┘
                             ↓
             ┌───────────────┼───────────────┐
             ↓               ↓               ↓
       Model Metrics     Scorecard      Interpretation
       AUC/Gini/KS       Points         Coefficients
             │               │               │
             └───────────────┼───────────────┘
                             ↓
                  ┌─────────────────────┐
                  │ Business Dashboard  │
                  │ Risk vs. Volume     │
                  └─────────────────────┘
```

---

# 📚 Key Concepts

The project incorporates concepts from:

* Exploratory Data Analysis
* Binary Classification
* Logistic Regression
* Maximum Likelihood Estimation
* Odds and Log-Odds
* Weight of Evidence
* Information Value
* Credit Scorecards
* ROC Curves
* AUC
* Gini Coefficient
* KS Statistic
* Statistical Significance
* Feature Engineering
* Outlier Treatment
* Multicollinearity
* Classification Trees
* Discriminant Analysis
* MCA
* Correspondence Analysis
* Multidimensional Scaling
* Business Threshold Optimisation
* Model Interpretability
* AI-Assisted Development

---

# 🎯 Final Outcome

The final outcome is an **interactive credit-risk analytics workstation** that connects statistical theory with practical credit-risk decision-making.

Rather than treating machine learning as a black-box prediction exercise, the project focuses on answering three questions:

### 1. What is happening in the data?

Exploratory analysis identifies distributions, relationships, anomalies, and borrower subgroups.

### 2. Why is the model making its predictions?

Logistic regression, statistical coefficients, WoE, scorecard concepts, and model metrics provide interpretable explanations.

### 3. What does the prediction mean for the business?

The decision dashboard translates model probabilities into lending-policy scenarios and demonstrates the relationship between approval volume and portfolio risk.

---

# 🏦 Project Philosophy

> **Predict risk. Understand risk. Explain risk. Make better decisions.**

The project demonstrates how interpretable statistical modelling can be combined with interactive analytics to create a credit-risk system that is not only predictive, but also understandable, auditable, and useful for business decision-making.

---

## 📅 Project

**DataQuest 2026**

**Domain:** Credit Risk Analytics
**Primary Model:** Logistic Regression
**Application:** Interactive Credit Risk Workstation
**Focus:** Interpretability, Exploratory Analysis, Risk Modelling & Decision Support

---

## 👤 AI Usage Statement

Artificial intelligence was used during the development of this project as a research, reasoning, explanation, and validation assistant. AI-generated suggestions were critically evaluated by the project team and were not automatically treated as correct. Final methodological, modelling, architectural, and implementation decisions were made based on the project requirements, analytical reasoning, and evaluation of the available data.
