package com.dlv.isale;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import ch.byrds.capacitor.contacts.Contacts;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(com.getcapacitor.community.admob.AdMob.class);
        registerPlugin(Contacts.class);
        super.onCreate(savedInstanceState);
    }
}