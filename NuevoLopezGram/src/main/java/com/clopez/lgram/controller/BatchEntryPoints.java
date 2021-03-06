package com.clopez.lgram.controller;

import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.clopez.lgram.datamodel.Event;
import com.clopez.lgram.datamodel.EventRepository;
import com.clopez.lgram.datamodel.RemovedUser;
import com.clopez.lgram.datamodel.RemovedUserRepository;
import com.clopez.lgram.datamodel.UserRepository;
import com.clopez.lgram.datamodel.jsonStatus;
import com.google.api.gax.paging.Page;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.Bucket;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.Storage.BlobListOption;
import com.google.cloud.storage.StorageOptions;

@RestController
public class BatchEntryPoints {

	@Value("${gcp_storage_bucket}")
	private String bucket;
	@Value("${pictures_folder}")
	private String picFolder;
	@Value("${trash_folder}")
	private String trashFolder;
	@Value("${batch_keyword}")
	private String batch_keyword;
	
	@Autowired
	private EventRepository eRep;

	@Autowired
	private RemovedUserRepository uremRep;

	private static Storage storage = StorageOptions.getDefaultInstance().getService();
	private static final Logger logger = Logger.getLogger(BatchEntryPoints.class.getName());
	
	@PostMapping("/cleanTrash")
	public @ResponseBody jsonStatus cleanTrash(@RequestBody Map<String, String> keyword){
		if (! keyword.get("Key").equals(batch_keyword))
			return new jsonStatus("NOT OK", "Not Allowed");
		
		int ret = emptyFolder(trashFolder);
		logger.info("Removed " + ret + " files from trash folder");
		return new jsonStatus("OK", "Removed " + ret + " files from trash folder");
	}
	
	@PostMapping("/cleanUsers")
	public @ResponseBody jsonStatus cleanUsers(@RequestBody Map<String, String> keyword) {
		if (! keyword.get("Key").equals(batch_keyword))
			return new jsonStatus("NOT OK", "Not Allowed");
		
		int cleanedUsers = 0;
		int removedPosts = 0;
		int removedFiles = 0;
		
		ArrayList<RemovedUser> remlist = (ArrayList) uremRep.findAll();
		for (RemovedUser ru : remlist) {
			removedPosts += removePosts(ru);
			removedFiles += removeMulti(ru);
			cleanedUsers++;
			ru.setCleanedAt(new Date());
			uremRep.save(ru);
		}
		return new jsonStatus("OK","Processed "+cleanedUsers+" removing "+removedPosts+"and "+removedFiles+" media files");
	}
	
	private int removePosts(RemovedUser ru) {
		List<Event> elist = eRep.getEventsFromUserEmail(ru.getEmail()); //List of event id's belonging to removed user
		eRep.deleteAll(elist);
		return elist.size();
	}
	
	private int removeMulti(RemovedUser ru) {
		Page<Blob> blobs = storage.list(bucket, BlobListOption.currentDirectory(),
			     BlobListOption.prefix(picFolder));
		return 0;
	}
	
	private int emptyFolder(String folder) {
		int ret = 0;
	    Page<Blob> blobs = storage.get(bucket).list(Storage.BlobListOption.prefix(folder+"/"),
	            Storage.BlobListOption.currentDirectory());

	    for (Blob blob : blobs.iterateAll()) {
	    	if (! blob.getName().equals(folder+"/")) {
	    		blob.delete();
	    		ret++;
	    	}
	    }

		return ret;
	}
}
