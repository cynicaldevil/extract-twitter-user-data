var Twitter = require('twitter');
var fs = require('fs');

// Store your auth tokens in keys.json
const oauth_data = JSON.parse(fs.readFileSync('./keys.json'));
var client = new Twitter({
    consumer_key: oauth_data.consumer_key,
    consumer_secret: oauth_data.consumer_secret, 
    access_token_key: oauth_data.access_token_key,
    access_token_secret: oauth_data.access_token_secret,
});

get_query_strs = (data) => {
    let arr = [];
    let i;
    let str = '';
    for(i = 0; i < data.length; i++) {
        str += data[i].replace(/\s+/, "") + ',';
        // Break up into strings containing 100 usernames to overcome
        // Twitter's limit
        if(i !== 0 && i%99 === 0) {
            arr.push(str);
            str = '';
        }
    }
    arr.push(str);
    return arr;
};

fs.readFile(process.argv[2], 'utf8', (err, data) => {
    if (err) throw err;

    const user_names = data.split(/\r\n|\r|\n/);
    const user_str_arr = get_query_strs(user_names);
    let user_data = [];

    let promise_objs = user_str_arr.map((user_str) => {
        const params = {screen_name: user_str};

        return client.get('users/lookup', params)
        .then((data) => {
            let extract_data = data.map((user) => {
                return {
                    name: user.name,
                    id: user.id,
                    location: user.location,
                    profile_image_url: user.profile_image_url,
                    favourites_count: user.favourites_count,
                    description: user.description,
                    url: user.url,
                    lang: user.lang,
                    followers_count: user.followers_count,
                    protected: user.protected,
                    time_zone: user.time_zone,
                    statuses_count: user.statuses_count,
                };
            });
            user_data = user_data.concat(extract_data);
        })
        .catch((err) => console.log(err));
    });

    Promise.all(promise_objs).then(() => {
        const json = JSON.stringify(user_data);
        fs.writeFile(process.argv[2], json, 'utf8', (err) => {
            if(err) throw err;
            console.log('Data written to file successfully!');
        });
    });

});
