from pathlib import Path
import streamlit as st
import streamlit.components.v1 as components
from inline_site import build_html

st.set_page_config(page_title="Gruhapravesham | Our New Home", page_icon="🏠",
                   layout="wide", initial_sidebar_state="collapsed")

# Hide Streamlit's own chrome and let the invitation fill the whole screen.
st.markdown("""
<style>
[data-testid="stHeader"],[data-testid="stToolbar"],[data-testid="stDecoration"],
[data-testid="stStatusWidget"],footer,#MainMenu{display:none!important}
html,body,[data-testid="stAppViewContainer"],[data-testid="stMain"],.main,.block-container{
  padding:0!important;margin:0!important;max-width:100%!important;overflow:hidden!important;background:#102c26}
iframe{position:fixed!important;top:0;left:0;width:100vw!important;height:100vh!important;
  height:100dvh!important;border:0!important;z-index:99999}
</style>""", unsafe_allow_html=True)

@st.cache_data(show_spinner=False)
def load_site() -> str:
    return build_html(Path(__file__).parent / "site")

components.html(load_site(), height=900, scrolling=True)
