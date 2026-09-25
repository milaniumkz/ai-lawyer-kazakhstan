plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

import java.util.Properties

val uploadKeystoreProperties = Properties()
val uploadKeystorePropertiesFile = rootProject.file("key.properties")
val hasUploadKeystore = uploadKeystorePropertiesFile.exists()
if (hasUploadKeystore) {
    uploadKeystoreProperties.load(uploadKeystorePropertiesFile.inputStream())
}

android {
    namespace = "kz.milanium.lawyer"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        applicationId = "kz.milanium.lawyer"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        if (hasUploadKeystore) {
            create("upload") {
                keyAlias = uploadKeystoreProperties["keyAlias"] as String
                keyPassword = uploadKeystoreProperties["keyPassword"] as String
                storeFile = file(uploadKeystoreProperties["storeFile"] as String)
                storePassword = uploadKeystoreProperties["storePassword"] as String
            }
        }
    }

    buildTypes {
        release {
            signingConfig = if (hasUploadKeystore) {
                signingConfigs.getByName("upload")
            } else {
                signingConfigs.getByName("debug")
            }
        }
    }
}

flutter {
    source = "../.."
}
