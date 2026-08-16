import React, { useState } from 'react';
import { 
  BookOpen, 
  FileText, 
  TrendingUp, 
  Cpu, 
  ShieldCheck, 
  Search, 
  ChevronRight, 
  Sparkle, 
  ArrowRight,
  Clipboard,
  Check,
  Scale,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

export const MODULE = {
  name: "Governance & Research",
  icon: "BookOpen",
  description: "Banking-grade model development reports, regulatory explainability dossiers, and metric definitions.",
  route: "/research"
};

// Research Dossiers structured perfectly according to Basel III and model governance standards.
const DOSSIERS = [
  {
    id: "logistic_regression",
    category: "Baseline Model (GLM)",
    title: "1.0 Generalised Linear Models: Logistic Regression Scorecards",
    author: "Core Credit Risk Analytics & Model Validation Team",
    approvalStatus: "SARB Compliant - Approved in Principle",
    icon: FileText,
    summary: "Formal documentation of the baseline Generalized Linear Model (GLM) for Probability of Default (PD) scoring on retail lending assets.",
    sections: [
      {
        heading: "1. Definition",
        content: `Logistic Regression is a Generalized Linear Model (GLM) parameterized to predict a binary categorical response variable $Y \in \{0, 1\}$. In the context of credit underwriting risk modeling, the response represents a borrower's 12-month default horizon:
          
  • Y = 1 : Default state (Severe Delinquency / 90+ Days Past Due or bankruptcy)
  • Y = 0 : Non-default compliant state ("Good" borrower)
  
Unlike ordinary linear models, Logistic Regression maps continuous and categorical predictors into a bounded probability interval $[0, 1]$ representing the conditional Probability of Default (PD).`
      },
      {
        heading: "2. Why It Exists",
        content: `Standard Ordinary Least Squares (OLS) regression fails when estimating binary lending events. OLS is linear in probability space, meaning prediction outputs are unbounded and can theoretically fall below 0 or exceed 1 (which are mathematically invalid as probabilities). 

Furthermore, binary outcomes violate critical OLS regression assumptions:
  • Error terms cannot be normally distributed; they follow a Bernoulli distribution.
  • Output variances are heteroscedastic, changing depending on the level of independent inputs.
  • Relative risks are inherently non-linear. The incremental default risk of a 10-point FICO drop is much higher for a high-risk borrower (e.g., FICO 600 to 590) than for a prime borrower (e.g., FICO 800 to 790).

Logistic Regression overcomes these fatal flaws by using Maximum Likelihood Estimation (MLE) and transforming the output through the sigmoid (logistic link) function, aligning risk smoothly to log-odds.`
      },
      {
        heading: "3. Mathematical Foundation",
        content: `The mathematical framework models the log-odds of default as a linear combination of the predictors.

Linear Predictor (Log-odds index η):
  η = β₀ + β₁x₁ + β₂x₂ + ... + βₙxₙ

Where:
  • η is the linear combination of the borrower features (log-odds index).
  • β₀ is the model intercept (the log-odds baseline when all predictors are zero).
  • βᵢ represent regression coefficients assigned to predictors xᵢ.

Probability Transformation (Sigmoid / Cumulative Logistic Distribution):
  P(Y = 1 | X) = 1 / (1 + e^(−η))

Log-odds Mapping (Logit link function):
  log(p / (1 − p)) = β₀ + β₁x₁ + ... + βₙxₙ

Where:
  • p represents the Probability of Default: P(Y = 1 | X).
  • (p / (1 − p)) is the borrower's odds of defaulting.`
      },
      {
        heading: "4. How It Works",
        content: `The algorithm calculates risk sequentially:
  1. Feeds borrower metrics (e.g. FICO Score, Debt-to-Income, Delinquencies) into the loglogit function.
  2. Solves for parameters β using Maximum Likelihood Estimation (MLE) to maximize the probability of observing the historical good/bad distribution.
  3. Returns a standardized probability (PD) between 0 and 1.
  4. Decisioning Rule: The bank sets a threshold cutoff P_crit. If estimated PD > P_crit, the loan application is rejected; else, it is approved. 

Advanced lending desks adjust P_crit continuously to reflect changing economic conditions and regulatory capital reserves.`
      },
      {
        heading: "5. Interpretation",
        content: `A key benefit of Logistic Regression is the direct interpretability of its coefficients. 

• Sign of Coefficients:
  • A positive coefficient (βᵢ > 0) indicates that an increase in the predictor increases the log-odds of default (e.g., higher Delinquency Count).
  • A negative coefficient (βᵢ < 0) indicates that an increase in the predictor reduces the odds of default (e.g., higher Annual Income).

• Odds Ratios (e^βᵢ):
  • Exponentiating a coefficient (exp(βᵢ)) provides the Odds Ratio (OR). 
  • For instance, if the coefficient for 'Previous Delinquency' is β = 0.693, then exp(0.693) = 2.0. This means every additional delinquency doubles the odds of the applicant defaulting, holding other risk factors static.`
      },
      {
        heading: "6. Application in Credit Risk",
        content: `Within retail lending, Logistic Regression serves as the industry standard for:
  • Application Scorecards: Assessing risk at the exact point of credit intake.
  • Behavioural Scoring: Periodically updating risk estimates on active loan-books.
  • Expected Loss (EL) Computations: Feeding directly into Basel III Expected Loss functions:
    
  EL = PD × LGD × EAD

Where LGD is Loss Given Default (how much of the loan is unrecoverable) and EAD is Exposure at Default (the outstanding loan balance). Basel III rules determine legal reserve capital requirements based on these estimates.`
      },
      {
        heading: "7. Weight of Evidence (WoE) & IV Integration",
        content: `To build robust scorecards, models transform raw variables using Weight of Evidence (WoE) prior to fitting. 

The mathematical WoE of a given bin 'i' is:
  WoE_i = ln( (% Good_i) / (% Bad_i) )

And the overall predictive power is evaluated via Information Value (IV):
  IV = Σ [ (% Good_i - % Bad_i) × WoE_i ]

Integrating WoE eliminates the need for arbitrary scaling, handles outlier extremes naturally without distortion, manages missing values systematically, and linearizes any non-monotonic relationship with log-odds.`
      },
      {
        heading: "8. Strengths",
        content: `• Unmatched Explainability: Tracing decisions to precise features satisfies consumer protection legislation.
  • Direct Logistic Mapping: Automatically outputs well-calibrated probabilities.
  • General Stability: Less vulnerable to extreme overfitting than non-parametric algorithms like Neural Networks.
  • Standard Auditable Footprint: Clear statistical inference testing (Wald tests, deviance tracking, likelihood ratio tests).`
      },
      {
        heading: "9. Weaknesses",
        content: `• Hard Linear Boundary: Incapable of identifying spontaneous non-linear interactiveness unless variables are explicitly engineered.
  • Multicollinearity Vulnerability: Correlated predictors (e.g., total debts and debt-to-income) inflate coefficient standard errors, leading to model instability.
  • Sensitive to Coarse Binning: Binning continuous data can drop fine granular risk variances.`
      },
      {
        heading: "10. Comparison to Other Models",
        content: `• Performance vs. Compliance: While ensemble models like LightGBM or Random Forests capture complex patterns to yield higher AUC, they lack transparency.
  • GLM Dominance: Banks prefer Logistic Regression (GLM) for core credit decisions because explaining credit denials to customers is legally required, and model governance is far less complex.`
      },
      {
        heading: "11. Regulatory Perspective",
        content: `International regulations (including SARB and federal regulators) require banks to establish clear audit records:
  • Adverse Action Explanations: Legally, banks must cite specific factors for loan declinations (e.g., 'FICO score below threshold'). Logistic regression allows extracting clear point deductions.
  • Bias Control: Standardizes compliance audits to prevent discriminatory variables from acting as proxies (e.g., zip codes proxying race).`
      },
      {
        heading: "12. Influence on Our Project",
        content: `For the 'DataQuest 2026' system, Logistic Regression shapes the entire modeling workflow:
  • Guides our EDA to focus heavily on identifying linear log-odds patterns.
  • Dictates our WoE transformations to assure monotonic risk trends.
  • Inspires our interactive scorecard allocation UI, where linear log-odds are converted into rounded integer points using PDO scoring math.`
      },
      {
        heading: "13. Final Conclusion",
        content: `Logistic Regression remains the industry-preferred standard in retail banking. It maintains an optimal balance between predictive accuracy, business interpretability, governance simplicity, and regulatory compliance. By leveraging specialized preprocessing like WoE, its performance approaches advanced machine learning benchmarks while remaining fully auditable.`
      }
    ],
    additionalSections: [
      {
        heading: "Feature Engineering Philosophy",
        content: `Our feature engineering framework prioritizes risk alignment and business logic over arbitrary mathematical transformations. We verify that risk factors correspond to proven credit behavior (e.g. higher utilization must exhibit higher default rate). This prevents overfitting, respects economic intuition, and ensures regulators approve the model.`
      },
      {
        heading: "Why WoE Improves Logistic Regression",
        content: `Exchanging raw variables for WoE transforms credit scores. It transforms non-linear variables into linear risk trends relative to log-odds. Consequently, the logistic regression converges much faster and outputs highly stable coefficients resistant to outliers and database fluctuations.`
      },
      {
        heading: "Business Impact Discussion",
        content: `A model's value is determined by its impact on the bank's bottom line. Upgrading from static rules to a well-calibrated GLM model allows the bank to optimize interest pricing based on risk. This expands the approval rate of low-risk borrowers without exposing the bank to sudden default spikes.`
      },
      {
        heading: "Model Stability Considerations (PSI / CSI)",
        content: `Portfolio monitoring utilizes Population Stability Index (PSI) to track data drift over time. An model is only as safe as its stability. If consumer utilization changes due to economic shifts, PSI tracks this. This ensures the model is regularly retrained if score distributions fall out of line.`
      }
    ]
  },
  {
    id: "decision_trees",
    category: "Challenger Model",
    title: "2.0 Supervised Segmentations: Decision & Classification Trees",
    author: "Model Validation Taskforce & Analytics Lab",
    approvalStatus: "Challenger Use Only - Internal Monitoring",
    icon: Cpu,
    summary: "Evaluation of non-parametric Decision Tree classifiers used as challenger models to explore complex interactive borrower behaviors.",
    sections: [
      {
        heading: "1. Definition",
        content: `A Decision Tree is a non-parametric supervised machine learning model used for classification and regression tasks. In credit risk, a Classification Tree partitions a borrower population into homogeneous subgroups based on sequential rule-based thresholds, attempting to isolate high-risk default segments ($Y=1$) from compliant borrowers ($Y=0$).`
      },
      {
        heading: "2. Why It Exists",
        content: `Real-world credit portfolios often exhibit non-linear interactiveness that Logistic Regression struggles with. For example, high Debt-to-Income (DTI) might only trigger defaults when combined with low FICO scores or short employment tenures.

While GLM models require credit analysts to find and hardcode these interactions, Decision Trees reveal these complex thresholds automatically from raw borrower data.`
      },
      {
        heading: "3. Mathematical Foundation",
        content: `The mathematical objective is to select splits that maximize the reduction of impurity at each node.

Gini Impurity Metric:
  Gini(D) = 1 − Σ (p_k)^2

Where:
  • D represents the dataset context at a given node.
  • p_k is the proportion of borrowers belonging to class k (defaults vs non-defaults) inside the node.

Information Gain (Split Evaluation):
  Gain(D, A) = Gini(D) − Σ [ (|D_v| / |D|) × Gini(D_v) ]

Where A is the splitting attribute candidate, and D_v is the resulting child branch subset. The split that yields the largest Gini reduction is chosen.`
      },
      {
        heading: "4. How It Works",
        content: `The tree grows recursively:
  1. Starts with the full population in the root node.
  2. Evaluates all variables and potential cutoffs (e.g., Credit Utilisation > 75%) across the borrower book.
  3. Splits the node to maximize population purity.
  4. Repeats recursively for each branch until stopping criteria (e.g., maximum depth or minimum leaf size) are met.
  5. Assigns an final default probability (PD) to each leaf node based on its default/non-default ratio.`
      },
      {
        heading: "5. Interpretation",
        content: `Small decision trees are easy to interpret. A business user can trace the decision path like a flowchart:
  'IF FICO < 640 AND Credit Utilisation > 80% THEN Reject applicant.'

However, as tree depth increases, interpretation becomes difficult. Large trees create intricate, fragmented segments that are hard to justify logically or legally.`
      },
      {
        heading: "6. Application in Credit Risk",
        content: `Decision trees are rarely used as standalone approval engines in retail scoring. Instead, they support:
  • Policy Rule Derivations: Constructing basic knock-out criteria (e.g. minimum age or automatic rejection thresholds).
  • Sub-Portfolio Segmentations: Classifying portfolios into separate risk pools prior to applying GLM scorecards.
  • Collections Routing: Assisting collectors in routing defaulted loans based on borrower behavioral branches.`
      },
      {
        heading: "7. WoE / IV Integration",
        content: `While Decision Trees do not mathematically require WoE encoding (since they handle non-linearity and outliers naturally), trees can assist in the scorecard development process. 

Modellers run decision trees on single numerical dimensions to discover optimal bins for monotonic WoE grouping. This replaces subjective bin boundaries with statistically pure, data-driven cuts.`
      },
      {
        heading: "8. Strengths",
        content: `• Discovers Interactions Automatically: Identifies combined risk patterns without manual feature engineering.
  • Robust to Monotonic Transforms: Scaling variables (e.g. logarithmic conversions) does not alter tree splits.
  • Intuitive Hierarchy: Simple trees represent risk policies as clear visual flowcharts.`
      },
      {
        heading: "9. Weaknesses",
        content: `• High Variance (Instability): Small changes in credit training data can lead to completely different splits, making validation difficult.
  • Susceptible to Overfitting: Unconstrained trees split until they memorize the training set, causing poor out-of-sample performance.
  • Coarse Prediction Gradients: Decision trees yield step-wise probabilities rather than smooth risk scores.`
      },
      {
        heading: "10. Comparison to Other Models",
        content: `• Decision Trees vs. GLM Scorecards: Scorecards provide smooth credit adjustments, whereas Decision Trees apply step-like thresholds.
  • Logistic Stability: Logistic regression is highly stable and predictable, making it the preferred choice over Decision Trees for regulatory compliance.`
      },
      {
        heading: "11. Regulatory Perspective",
        content: `Lending regulators view deep decision trees with caution:
  • Black-Box Segmentations: Very deep trees create segments that are difficult to evaluate for fair lending practices.
  • Policy Rule Validation: Regulators look closely at step-wise risk assignments to ensure borrowers with near-identical profiles aren't treated drastically differently due to an arbitrary split.`
      },
      {
        heading: "12. Influence on Our Project",
        content: `In the DataQuest 2026 project, Decision Trees serve as a primary analytical benchmark. They help:
  • Reveal hidden interactions in our simulated loan dataset.
  • Provide a baseline comparison against our final GLM Logistic model.
  • Benchmark predictive performance against our LightGBM model.`
      },
      {
        heading: "13. Final Conclusion",
        content: `While trees are powerful automatic segmenters, their lack of stability and smooth probabilities prevents them from replacing GLM scorecards in retail lending. However, they remain highly valuable as diagnostic tools to discover credit risk interactions and establish optimal binning templates for WoE features.`
      }
    ],
    additionalSections: [
      {
        heading: "Model Evaluation Diagnostics & Metrics Compliance",
        content: `We evaluate models using Gini coefficients and Receiver Operating Characteristics (ROC AUC). 
        
The Area Under the Curve (AUC) measures a model's ability to rank-order risk:
  AUC = ∫ TPR d(FPR)

And Gini is derived from AUC:
  Gini = 2 × AUC − 1

A higher Gini indicates a strong ability to separate good and bad borrowers, ensuring the scorecard is calibrated correctly.`
      },
      {
        heading: "Precision vs Recall Business Interpretation",
        content: `Lending portfolios face a continuous trade-off between Precision and Recall:
  • Precision (Approval Quality): Focuses on minimizing defaults among loans approved. High precision reduces credit write-offs.
  • Recall (Default Detection): Focuses on catching as many defaults as possible. High recall ensures the bank avoids systemic defaults at the expense of rejecting potentially good applicants.`
      },
      {
        heading: "Regulatory Concerns & Bias Mitigation",
        content: `Lending models must be audited for historical biases and proxy discrimination. If a model utilizes factors that correlate with protected demographics (such as geographic regions proxying race), it can cause illegal bias. Model governance audits must exclude these proxy features to ensure the model makes objective, risk-based decisions.`
      }
    ]
  }
];

export default function ResearchConceptsModule() {
  const [activeDossierId, setActiveDossierId] = useState<string>("logistic_regression");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [copiedSectionIndex, setCopiedSectionIndex] = useState<number | null>(null);

  const activeDossier = DOSSIERS.find(d => d.id === activeDossierId) || DOSSIERS[0];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedSectionIndex(index);
    setTimeout(() => setCopiedSectionIndex(null), 2000);
  };

  // Filter sections inside the active dossier if a search term exists
  const filteredSections = activeDossier.sections.filter(sec => 
    sec.heading.toLowerCase().includes(searchTerm.toLowerCase()) || 
    sec.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAdditional = activeDossier.additionalSections?.filter(sec =>
    sec.heading.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sec.content.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div id="research-module-root" className="space-y-6 animate-fade-in text-gray-750">
      
      {/* PROFESSIONAL BANKING HEADER */}
      <div className="bg-white border rounded-xl p-6 border-gray-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <BookOpen className="w-48 h-48 text-[#0B1F3A]" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest flex items-center gap-1">
              <Sparkle className="w-3 h-3 fill-[#D4AF37]" /> First National Bank Group Risk Library
            </span>
            <h2 className="text-xl font-black text-[#0B1F3A] tracking-tight">
              DataQuest 2026 — Model Governance & Research Dossiers
            </h2>
            <p className="text-xs text-gray-500 max-w-2xl">
              Internal development notes, mathematical formulations, and validation materials for regulated credit risk rating models. Complies with the South African Reserve Bank (SARB) and Basel Accord governance frameworks.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            <div className="bg-[#0B1F3A]/5 border border-[#0B1F3A]/10 px-3 py-1.5 rounded-lg text-right hidden sm:block">
              <span className="text-[8px] uppercase text-gray-400 block tracking-wider font-bold">Standard Version</span>
              <span className="text-xs font-mono font-bold text-[#0B1F3A]">BASEL_III_GLM_v4</span>
            </div>
            <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 px-3 py-1.5 rounded-lg text-left">
              <span className="text-[8px] uppercase text-gray-500 block tracking-wider font-bold">Security Rating</span>
              <span className="text-xs font-mono font-bold text-yellow-700">RESTRICTED_INTERNAL</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT NAV PANEL - DOSSIERS SELECTOR */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
            <div className="pb-2 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Model Book Index
              </span>
              <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-mono font-bold">
                {DOSSIERS.length} Chapters
              </span>
            </div>

            <div className="space-y-2">
              {DOSSIERS.map((doc) => {
                const isSel = doc.id === activeDossierId;
                const IconComp = doc.icon;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => {
                      setActiveDossierId(doc.id);
                      setSearchTerm("");
                    }}
                    className={`w-full flex items-start gap-3 p-3.5 rounded-xl text-left border transition-all duration-200 cursor-pointer ${
                      isSel
                        ? 'bg-[#0B1F3A] border-[#0B1F3A] text-white shadow-md'
                        : 'bg-[#F9FAFB] border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-100/60'
                    }`}
                  >
                    <span className={`p-2 rounded-lg shrink-0 mt-0.5 ${isSel ? 'bg-[#D4AF37] text-white' : 'bg-white text-[#0B1F3A] border border-gray-150'}`}>
                      <IconComp className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className={`text-[9px] uppercase font-bold block ${isSel ? 'text-[#4A90E2]' : 'text-[#D4AF37]'}`}>
                        {doc.category}
                      </span>
                      <h4 className="text-xs font-bold truncate mt-0.5">
                        {doc.title}
                      </h4>
                      <p className={`text-[10px] line-clamp-2 mt-1 leading-normal ${isSel ? 'text-gray-300' : 'text-gray-400'}`}>
                        {doc.summary}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SEARCH INSTRUMENT */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <label className="text-[10px] font-bold text-[#0B1F3A] uppercase tracking-wider block mb-2">
              Interactive Section Search
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search equations, definitions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#F9FAFB] border border-gray-2 border-gray-250 rounded-lg py-2 pl-9 pr-3 text-xs focus:ring-1 focus:ring-[#D4AF37] focus:bg-white outline-none placeholder:text-gray-450 transition"
              />
            </div>
            {searchTerm && (
              <span className="text-[9px] text-[#D4AF37] font-semibold mt-2 block italic text-center">
                Refining to matches containing "{searchTerm}"
              </span>
            )}
          </div>

          {/* BASEL COMPLIANCE STITCH / QUOTE BOX */}
          <div className="bg-[#0B1F3A] text-white rounded-xl p-5 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Scale className="w-24 h-24" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" /> Regulatory Directive
            </h4>
            <p className="text-[11px] text-gray-300 mt-2 leading-relaxed">
              "All credit risk rating scorecards deployed into First National Bank retail systems must conform with standard Generalised Linear formulations. Monotonic behavior under WoE transformation must be verified by model governance committees."
            </p>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[9px] text-gray-400 font-mono">
              <span>SARB REG-7A</span>
              <span>COMPLIANT v2026</span>
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT PANEL - DETAILED DOSSIER VIEW */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
            
            {/* Dossier Meta Info Header */}
            <div className="border-b border-gray-150 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#0B1F3A]/5 text-[#0B1F3A] rounded font-mono">
                    Model Document Submission
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 bg-green-50 text-green-700 rounded font-mono">
                    {activeDossier.approvalStatus}
                  </span>
                </div>
                <h3 className="text-lg font-black text-[#0B1F3A] tracking-tight mt-1">
                  {activeDossier.title}
                </h3>
                <div className="text-[10px] text-gray-400 font-mono flex items-center gap-3">
                  <span>Author: {activeDossier.author}</span>
                  <span>•</span>
                  <span>Published: 2026-05-22</span>
                </div>
              </div>

              <div className="bg-[#F9FAFB] border border-gray-200 p-2.5 rounded-lg flex items-center gap-2 max-w-xs leading-none shrink-0 self-start">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                <div>
                  <span className="text-[8px] uppercase text-gray-400 block tracking-wider">Lending Registry</span>
                  <span className="text-[10px] font-bold text-[#0B1F3A]">REGULATORY APPROVED</span>
                </div>
              </div>
            </div>

            {/* General Overview Summary Info */}
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-600 leading-relaxed italic">
              <strong>Analyst Note:</strong> {activeDossier.summary}
            </div>

            {/* SECTIONS LAYOUT */}
            <div className="space-y-6">
              {filteredSections.length > 0 ? (
                filteredSections.map((sec, idx) => {
                  const isMath = sec.heading.includes("Mathematical");
                  return (
                    <div 
                      key={idx} 
                      className={`group border-b border-gray-100 pb-5 last:border-0 last:pb-0 transition-all duration-300`}
                    >
                      <div className="flex items-center justify-between mb-2 pb-1">
                        <h4 className="text-xs font-bold text-[#0B1F3A] uppercase tracking-wider flex items-center gap-1.5">
                          {isMath ? <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" /> : <FileText className="w-3.5 h-3.5 text-gray-400" />}
                          {sec.heading}
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleCopy(sec.content, idx)}
                          className="text-[10px] text-gray-400 hover:text-[#0B1F3A] flex items-center gap-1 cursor-pointer font-semibold py-0.5 px-1.5 hover:bg-gray-100 rounded transition"
                          title="Copy block text to clipboard"
                        >
                          {copiedSectionIndex === idx ? (
                            <>
                              <Check className="w-3 h-3 text-green-600" />
                              <span className="text-green-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Clipboard className="w-3 h-3" />
                              <span>Copy Block</span>
                            </>
                          )}
                        </button>
                      </div>

                      {isMath ? (
                        <div className="bg-[#0B1F3A]/95 text-white p-5 rounded-xl font-mono text-center my-3 border border-gray-800 shadow-inner relative group/math">
                          <span className="absolute top-2 left-3 text-[8px] text-gray-500 uppercase tracking-widest font-sans font-bold">
                            REGL-MATH-ENGINE v1.2
                          </span>
                          <div className="space-y-3 pt-2">
                            {sec.content.split('\n\n').map((block, bIdx) => {
                              const isEq = block.includes('=') || block.includes('P(');
                              return (
                                <div key={bIdx} className={isEq ? "text-sm sm:text-base font-bold text-yellow-400 py-1" : "text-[11px] text-gray-300 max-w-lg mx-auto leading-normal"}>
                                  {block}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-650 leading-relaxed whitespace-pre-line space-y-2">
                          {sec.content}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-gray-400 text-xs">
                  No model sections matched the search query. Try another term.
                </div>
              )}
            </div>

            {/* COMPOSITE METRIC ADDITIONAL SECTIONS ZONE */}
            {filteredAdditional.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <span className="text-[10px] font-black text-[#0B1F3A] uppercase tracking-widest block mb-4">
                  Supplementary Governance Modules
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAdditional.map((addSec, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-[#F9FAFB] to-white border border-gray-200 rounded-xl p-4 shadow-xs hover:border-[#D4AF37]/50 transition duration-150">
                      <h4 className="text-xs font-bold text-[#0B1F3A] flex items-center gap-1.5 mb-2 border-b border-gray-150 pb-1.5">
                        <Sparkle className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]/20" />
                        {addSec.heading}
                      </h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        {addSec.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* PRINT / EXPORT DECISION COMPACT ZONE */}
          <div className="bg-[#F9FAFB] border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </span>
              <div>
                <span className="text-xs font-bold text-[#0B1F3A] block">Model Audit & Validation Checklist ready</span>
                <span className="text-[10px] text-gray-400 block leading-tight">Proceeding triggers internal compliance verification alert</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                window.print();
              }}
              className="bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer shadow-xs transition"
            >
              <Clipboard className="w-3.5 h-3.5" />
              Print Governance Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
