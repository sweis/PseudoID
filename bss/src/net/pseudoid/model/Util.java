package net.pseudoid.model;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.io.IOException;
import java.io.RandomAccessFile;

public class Util {
  
  private static final Gson GSON = 
    new GsonBuilder().excludeFieldsWithoutExposeAnnotation()
                     .setPrettyPrinting().create();
  
  public static Gson gson() {
    return GSON;
  }
  
  public static String readFile(String filename) {
    try {
      RandomAccessFile file = new RandomAccessFile(filename, "r");
      byte[] contents = new byte[(int) file.length()];
      file.read(contents);
      file.close();
      return new String(contents);
    } catch (IOException e) {
      e.printStackTrace();
      return "ERROR";
    }
  }
}