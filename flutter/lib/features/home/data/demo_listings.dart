import '../domain/listing.dart';

const _marina = City('dubai-marina', 'Dubai Marina', 25.0805, 55.1403, 'AED');
const _sharjah = City('sharjah', 'Sharjah', 25.3463, 55.4209, 'AED');
const _abuDhabi = City('abu-dhabi', 'Abu Dhabi', 24.4539, 54.3773, 'AED');
const _colombo = City('colombo', 'Colombo', 6.9271, 79.8612, 'LKR');

/// Cities the location card steps through (a subset of the Expo app's list).
const demoCities = [_marina, _sharjah, _abuDhabi, _colombo];

/// Top-level categories shown as chips on Home.
const categoryNames = {
  'cars': 'Cars',
  'phones': 'Phones',
  'furniture': 'Furniture',
  'fashion': 'Fashion',
  'electronics': 'Electronics',
  'property': 'Property',
  'kids': 'Kids',
  'sports': 'Sports',
};

const _maya = Seller(name: 'Maya K.', verified: true);
const _omar = Seller(name: 'Omar S.', verified: true);
const _layla = Seller(name: 'Layla A.', verified: false);
const _nimal = Seller(name: 'Nimal P.', verified: true);

/// Demo data behind the same interface the Supabase repository will implement in F2.
abstract class ListingRepository {
  Future<List<Listing>> all();
}

class DemoListingRepository implements ListingRepository {
  DemoListingRepository(this.now);

  final DateTime now;

  Listing _l(
    String id,
    String title,
    int price,
    String category,
    Condition condition,
    City city,
    Seller seller,
    int hoursAgo,
    int likes, {
    String? picture,
    String currency = 'AED',
    bool free = false,
  }) => Listing(
    id: id,
    title: title,
    priceMinor: price * 100,
    currency: currency,
    condition: condition,
    category: category,
    city: city,
    seller: seller,
    postedAt: now.subtract(Duration(hours: hoursAgo)),
    likes: likes,
    picture: picture,
    free: free,
  );

  @override
  Future<List<Listing>> all() async => [
    _l(
      '1',
      'iPhone 15 Pro 256GB',
      3200,
      'phones',
      Condition.likeNew,
      _marina,
      _maya,
      2,
      12,
      picture: 'iphone',
    ),
    _l(
      '2',
      'Toyota Land Cruiser 2019',
      145000,
      'cars',
      Condition.used,
      _abuDhabi,
      _layla,
      26,
      7,
      picture: 'landcruiser',
    ),
    _l(
      '3',
      'Majlis floor sofa set',
      1800,
      'furniture',
      Condition.used,
      _sharjah,
      _omar,
      3,
      4,
      picture: 'sofa',
    ),
    _l(
      '4',
      'PlayStation 5 + 2 controllers',
      1650,
      'electronics',
      Condition.likeNew,
      _marina,
      _maya,
      5,
      9,
      picture: 'ps5',
    ),
    _l(
      '5',
      'Designer abaya, size M',
      450,
      'fashion',
      Condition.likeNew,
      _abuDhabi,
      _layla,
      6,
      3,
      picture: 'abaya',
    ),
    _l(
      '6',
      'Mountain bike, barely used',
      900,
      'sports',
      Condition.likeNew,
      _marina,
      _omar,
      30,
      1,
      picture: 'bike',
    ),
    _l(
      '7',
      'Kids study desk',
      250,
      'kids',
      Condition.used,
      _sharjah,
      _omar,
      50,
      0,
      picture: 'desk',
    ),
    _l(
      '8',
      'MacBook Air M2',
      3900,
      'electronics',
      Condition.likeNew,
      _marina,
      _maya,
      8,
      15,
      picture: 'macbook',
    ),
    _l(
      '9',
      'Free: moving boxes, 20 pieces',
      0,
      'furniture',
      Condition.used,
      _marina,
      _maya,
      4,
      2,
      picture: 'boxes',
      free: true,
    ),
    _l(
      '10',
      '2 bed apartment for rent',
      62000,
      'property',
      Condition.used,
      _sharjah,
      _omar,
      12,
      5,
      picture: 'apartment',
    ),
    _l(
      '11',
      'Free: baby cot, good condition',
      0,
      'kids',
      Condition.used,
      _abuDhabi,
      _layla,
      20,
      6,
      picture: 'cot',
      free: true,
    ),
    _l(
      '12',
      'Samsung 55" QLED TV',
      1400,
      'electronics',
      Condition.used,
      _marina,
      _maya,
      70,
      2,
      picture: 'tv',
    ),
    _l(
      '13',
      'iPhone 14 128GB',
      215000,
      'phones',
      Condition.likeNew,
      _colombo,
      _nimal,
      3,
      8,
      picture: 'iphone',
      currency: 'LKR',
    ),
    _l(
      '14',
      'Honda Vezel 2016',
      9800000,
      'cars',
      Condition.used,
      _colombo,
      _nimal,
      20,
      5,
      picture: 'landcruiser',
      currency: 'LKR',
    ),
  ];
}
