package app.monm.secure;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int PERM_REQ = 100;
    private static final String[] PERMS = {
        Manifest.permission.RECORD_AUDIO,
        Manifest.permission.CAMERA
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        applyScreenshotBlock();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            requestMediaPermissionsIfNeeded();
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        applyScreenshotBlock();
    }

    private void applyScreenshotBlock() {
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
    }

    private void requestMediaPermissionsIfNeeded() {
        boolean need = false;
        for (String p : PERMS) {
            if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) {
                need = true;
                break;
            }
        }
        if (need) {
            ActivityCompat.requestPermissions(this, PERMS, PERM_REQ);
        }
    }
}
