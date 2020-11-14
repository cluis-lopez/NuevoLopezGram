package com.clopez.lgram.controller;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.Storage.BlobTargetOption;
import com.google.cloud.storage.Storage.PredefinedAcl;
import com.google.cloud.storage.StorageOptions;

@RestController
public class BlobUploadGCP {
  
	// get service by env var GOOGLE_APPLICATION_CREDENTIALS. Json file generated in API & Services -> Service account key
	private static Storage storage = StorageOptions.getDefaultInstance().getService();
	
	//Bucket name to store multimedia content
	@Value("${gcp_storage_bucket}")
	private String bucket;
	
    @PostMapping(path = "/upload", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public Map<String, String> uploadFile(@RequestPart(value = "file", required = true) MultipartFile files)  {
        //String name = azureAdapter.upload(files, "lgram_");
    	String name="";
    	Map<String, String> result = new HashMap<>();
		try {
			name = upload(files);
			result.put("key", name);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
        return result;
    }
    
	public String upload(MultipartFile file) throws IOException {
		
		try {			
			BlobInfo blobInfo = storage.create(
				BlobInfo.newBuilder(bucket, file.getOriginalFilename()).build(), //get original file name
				file.getBytes(), // the file
				BlobTargetOption.predefinedAcl(PredefinedAcl.PUBLIC_READ) // Set file permission
			);
			return blobInfo.getMediaLink(); // Return file url
		}catch(IllegalStateException e){
			throw new RuntimeException(e);
		}
  	}
}
