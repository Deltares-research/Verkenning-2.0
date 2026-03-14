import IdentityManager from "@arcgis/core/identity/IdentityManager";
import OAuthInfo from "@arcgis/core/identity/OAuthInfo";


const oauthInfo = new OAuthInfo({
    appId: "bF0Vj7tJiGzVrnlq",
    popup: true,
    portalUrl: "https://portal.wsrl.nl/portal",
    popupCallbackUrl: `http://localhost:3001/oath-callback.html`,
});

// IdentityManager.registerOAuthInfos([oauthInfo]);

export async function signIn() {
    IdentityManager.registerOAuthInfos([oauthInfo]);

    try {
        const credential = await IdentityManager.checkSignInStatus(oauthInfo.portalUrl + "/sharing");
        return credential;
    } catch {
        // Not signed in yet, trigger OAuth popup
        const credential = await IdentityManager.getCredential(oauthInfo.portalUrl + "/sharing");
        return credential;
    }
}