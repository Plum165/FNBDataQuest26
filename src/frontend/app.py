import streamlit as st
import pandas as pd
import numpy as np

# Adjust app configuration to wide structure
st.set_page_config(page_title="DataQuest 2026 Dashboard", layout="wide")

# --- DATA GENERATION ENGINE ---
@st.cache_data
def load_historical_loanbook():
    np.random.seed(42)
    n_samples = 300
    
    # Generate realistic retail credit variables
    fico = np.random.randint(500, 820, size=n_samples)
    dti = np.random.uniform(15, 60, size=n_samples)
    income = np.random.randint(2500, 11000, size=n_samples)
    
    # Inject Messy Dataset Flags (-99 placeholder anomalies)
    anomaly_indices = np.random.choice(n_samples, size=20, replace=False)
    outlier_indices = np.random.choice(n_samples, size=10, replace=False)
    
    fico_raw = fico.copy().astype(float)
    dti_raw = dti.copy().astype(float)
    
    fico_raw[anomaly_indices] = -99.0
    dti_raw[anomaly_indices] = -99.0
    fico_raw[outlier_indices] = 999.0  # Invalid outlier
    
    # Mathematical Sigmoid Function to assign true structural defaults
    # P(Default) = 1 / (1 + exp(-eta))
    true_eta = 5.2 - (0.012 * fico) + (0.05 * dti) - (0.00015 * income)
    p_default = 1 / (1 + np.exp(-true_eta))
    defaulted = np.random.binomial(1, p_default)
    
    return pd.DataFrame({
        'ApplicantID': range(1001, 1001 + n_samples),
        'FICO': fico_raw,
        'DTI': dti_raw,
        'MonthlyIncome': income,
        'DefaultWithin12M': defaulted
    })

df_raw = load_historical_loanbook()

# --- SIDEBAR INTERACTIVE CONTROL STRUCTURE ---
st.sidebar.title("DataQuest 2026 Desk")
st.sidebar.markdown("### Preprocessing Filters")

impute_toggle = st.sidebar.checkbox("Impute Anomaly Flags (-99)", value=True)
winsorize_toggle = st.sidebar.checkbox("Winsorize Extraneous Outliers", value=True)

# Main Screen Dashboard Tab Controllers
tab_selection = st.sidebar.radio(
    "Navigate Infrastructure View",
    ["📊 Interactive EDA View", "⚙️ Preprocessing Module", "📈 Logistic Modeling Engine", "🎯 Scorecard Points View"]
)

# --- PIPELINE PROCESSING LAYER ---
df_cleaned = df_raw.copy()

if impute_toggle:
    # Handle missing variable flags (-99) by matching against the structural dataset median
    fico_med = df_cleaned[df_cleaned['FICO'] > 0]['FICO'].median()
    dti_med = df_cleaned[df_cleaned['DTI'] > 0]['DTI'].median()
    df_cleaned['FICO'] = df_cleaned['FICO'].replace(-99.0, fico_med)
    df_cleaned['DTI'] = df_cleaned['DTI'].replace(-99.0, dti_med)

if winsorize_toggle:
    # Cap upper limits to credit regulatory standards (e.g., FICO max 850)
    df_cleaned['FICO'] = df_cleaned['FICO'].clip(upper=850.0, lower=300.0)
    df_cleaned['DTI'] = df_cleaned['DTI'].clip(upper=65.0)

# --- LIVE SUMMARY DATA LAYERS ---
total_records = len(df_cleaned)
observed_defaults = df_cleaned['DefaultWithin12M'].sum()
global_default_rate = (observed_defaults / total_records) * 100

st.title("Credit Evaluation Dashboard Framework")

# Global Performance KPI Strip
kpi1, kpi2, kpi3, kpi4 = st.columns(4)
kpi1.metric("Historical Bookings", f"{total_records} Accounts")
kpi2.metric("Observed Default Rate", f"{global_default_rate:.1f}%")
kpi3.metric("Portfolio Median FICO", int(df_cleaned[df_cleaned['FICO'] > 0]['FICO'].median()))
kpi4.metric("Portfolio Median DTI", f"{df_cleaned[df_cleaned['DTI'] > 0]['DTI'].median():.1f}%")

# --- SCREEN 1: INTERACTIVE EXPLORATORY DATA ANALYSIS ---
if tab_selection == "📊 Interactive EDA View":
    st.subheader("Risk Isolation Axis Matrix")
    st.markdown("Isolate risk matrices using sliders below to examine true risk separation thresholds across FICO and DTI coordinates.")
    
    col1, col2 = st.columns(2)
    with col1:
        min_fico = st.slider("Isolate Minimum Allowed FICO Profile", 300, 850, 500)
    with col2:
        max_dti = st.slider("Isolate Maximum Allowed Debt Leverage (DTI %)", 10, 100, 60)
        
    df_filtered = df_cleaned[
        (df_cleaned['FICO'] >= min_fico) & 
        (df_cleaned['DTI'] <= max_dti)
    ]
    
    # Construct Scatter Layout Graphing
    st.markdown(f"**Filtered Sub-sample Volume**: {len(df_filtered)} records match constraints.")
    
    # Dynamic scatter matrix using streamlit built-in fast plotting charts
    st.scatter_chart(
        data=df_filtered,
        x='FICO',
        y='DTI',
        color='DefaultWithin12M',
        use_container_width=True
    )

# --- SCREEN 2: PREPROCESSING DATA PIPELINE ---
elif tab_selection == "⚙️ Preprocessing Module":
    st.subheader("Data Cleaning Audit Trail")
    st.markdown("Observe side-by-side data corrections calculated automatically by the pipeline execution layers.")
    
    audit_df = pd.DataFrame({
        'ApplicantID': df_raw['ApplicantID'],
        'Raw FICO': df_raw['FICO'],
        'Processed FICO': df_cleaned['FICO'],
        'Raw DTI %': df_raw['DTI'],
        'Processed DTI %': df_cleaned['DTI']
    })
    st.dataframe(audit_df.head(15), use_container_width=True)

# --- SCREEN 3: INTERPRETABLE LOGISTIC PREDICTION ENGINE ---
elif tab_selection == "📈 Logistic Modeling Engine":
    st.subheader("Logistic Calibration Desk")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("#### Model Parameters Calibration")
        b0 = st.slider("Intercept Constant (β₀)", -2.0, 10.0, 5.2, step=0.1)
        b1 = st.slider("FICO Parameter Coeff (β₁)", -0.05, 0.01, -0.012, step=0.001)
        b2 = st.slider("DTI Parameter Coeff (β₂)", -0.02, 0.20, 0.05, step=0.005)
        b3 = st.slider("Income Parameter Coeff (β₃)", -0.0005, 0.0001, -0.00015, step=0.00001)
        st.markdown("---")
        risk_threshold = st.slider("Underwriting Risk Cutoff Boundary (%)", 5, 50, 20)
        
    with col2:
        st.markdown("#### Live Sandbox Underwriting Underwriter Desk")
        sim_fico = st.number_input("Underwriting Target FICO Profile", 300, 850, 720)
        sim_dti = st.number_input("Underwriting Target Debt Leverage (DTI %)", 0, 100, 32)
        sim_income = st.number_input("Underwriting Target Monthly Income ($)", 1000, 25000, 6200)
        
        # Calculate log odds and probability vector mappings
        eta = b0 + (b1 * sim_fico) + (b2 * sim_dti) + (b3 * sim_income)
        probability_default = 1.0 / (1.0 + np.exp(-eta))
        probability_pct = probability_default * 100.0
        
        st.markdown("#### Model Decision Logic Summary")
        st.info(f"Calculated Linear Logit Output ($\eta$): `{eta:.4f}`")
        
        if probability_pct > risk_threshold:
            st.error(f"**APPLICATION REJECTED**: Calculated Model Risk Profile `{probability_pct:.1f}%` exceeds safe boundary constraint of `{risk_threshold}%`.")
        else:
            st.success(f"**APPLICATION APPROVED**: Calculated Model Risk Profile `{probability_pct:.1f}%` sits safely under boundary limits.")

# --- SCREEN 4: BONUS SUB-TAB CREDIT SCORECARD ---
elif tab_selection == "🎯 Scorecard Points View":
    st.subheader("Point-Based Scorecard Allocation Architecture")
    st.markdown("Linear mapping models transform risk weights cleanly into a balanced asset scorecard metric system.")
    
    # Establish standard baseline weights for mathematical point assignment mapping
    factor = 28.854  # Score doubles every 20 points
    offset = 600.0
    
    # Dummy slider inputs matching core parameters
    b0, b1, b2, b3 = 5.2, -0.012, 0.05, -0.00015
    sim_fico, sim_dti, sim_income = 720, 32, 6200
    
    base_points = round(offset + factor * b0)
    fico_points = round(factor * b1 * sim_fico)
    dti_points = round(factor * b2 * sim_dti)
    income_points = round(factor * b3 * sim_income)
    
    final_score = base_points + fico_points + dti_points + income_points
    final_score = max(300, min(850, final_score))
    
    col1, col2 = st.columns([2, 1])
    with col1:
        st.markdown("#### Dynamic Attribute Table")
        scorecard_data = pd.DataFrame({
            'Credit Matrix Attribute Segment': ['Scorecard Intercept Baseline Weight', 'FICO Character Analysis Index', 'DTI Leverage Matrix Weight', 'Income Capacity Index Profile'],
            'Assigned Calculated Weight': [f"{base_points} points", f"{fico_points} points", f"{dti_points} points", f"{income_points} points"]
        })
        st.table(scorecard_data)
        
    with col2:
        st.metric("DERIVED RISK SCALE CREDIT SCORE", final_score)
        if final_score < 620:
            st.warning("Adverse Classification Level: Subprime Profile Boundary triggered.")
        else:
            st.success("Approval Security Level: Profile qualifies for standard automated underwriting.")